import { tool } from "@langchain/core/tools";
import type { RunnableConfig } from "@langchain/core/runnables";
import * as z from "zod";

import { extractToken } from "./_auth";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Configuration for the defineBackendTool factory.
 * TInput is inferred from the tool's Zod schema.
 */
interface BackendToolConfig<TInput> {
  /** Unique tool name in snake_case (exposed to the LLM) */
  name: string;
  /** English description for the LLM */
  description: string;
  /** Zod schema validating and typing the input */
  schema: z.ZodType<TInput>;
  /** HTTP method */
  method: HttpMethod;
  /**
   * Builds the relative path (including query string when applicable).
   * BACKEND_JAVA_ENDPOINT is prepended automatically.
   */
  buildPath: (input: TInput) => string;
  /**
   * Builds the JSON request body.
   * If omitted, no body or Content-Type header is sent.
   */
  buildBody?: (input: TInput) => unknown;
  /**
   * When provided, used as the success response instead of parsing res.json().
   * Useful for DELETE returning 204 No Content.
   */
  buildSuccessResult?: (input: TInput) => unknown;
  /**
   * Request timeout in milliseconds (AbortController).
   * If omitted, the request has no time limit.
   */
  timeoutMs?: number;
}

/**
 * Factory that creates a DynamicStructuredTool calling the Java backend.
 *
 * Encapsulates repeated boilerplate across tools:
 *   1. Extract JWT from config.configurable
 *   2. Build URL with BACKEND_JAVA_ENDPOINT
 *   3. fetch with Authorization header
 *   4. Handle HTTP and network errors
 *   5. Return JSON.stringify of the result
 */
export function defineBackendTool<TInput>(config: BackendToolConfig<TInput>) {
  const {
    name,
    description,
    schema,
    method,
    buildPath,
    buildBody,
    buildSuccessResult,
    timeoutMs,
  } = config;

  return tool(
    async (input: TInput, runnableConfig: RunnableConfig | undefined) => {
      const token = extractToken(runnableConfig);
      const endpoint = process.env.BACKEND_JAVA_ENDPOINT;
      const path = buildPath(input);
      const url = `${endpoint}${path}`;

      console.log(`[${name}] ${method} ${url}`);

      const hasBody = buildBody !== undefined;
      const body = hasBody ? buildBody(input) : undefined;

      let signal: AbortSignal | undefined;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      if (timeoutMs !== undefined) {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        signal = controller.signal;
      }

      let res: Response;
      try {
        res = await fetch(url, {
          method,
          headers: {
            ...(hasBody ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${token}`,
          },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          ...(signal !== undefined ? { signal } : {}),
        });
      } catch (err) {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        const msg =
          err instanceof Error && err.name === "AbortError"
            ? `${name} timed out after ${timeoutMs}ms`
            : String(err);
        console.error(`[${name}] network error:`, msg);
        return JSON.stringify({ error: msg });
      }

      if (timeoutId !== undefined) clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        console.error(`[${name}] HTTP error ${res.status}:`, text);
        return JSON.stringify({
          error: `Request failed: ${res.status} — ${text}`,
        });
      }

      if (buildSuccessResult !== undefined) {
        const result = buildSuccessResult(input);
        console.log(`[${name}] success:`, JSON.stringify(result, null, 2));
        return JSON.stringify(result);
      }

      const data: unknown = await res.json();
      console.log(`[${name}] response:`, JSON.stringify(data, null, 2));
      return JSON.stringify(data);
    },
    { name, description, schema },
  );
}
