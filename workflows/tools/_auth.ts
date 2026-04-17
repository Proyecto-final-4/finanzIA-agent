import type { RunnableConfig } from "@langchain/core/runnables";

/**
 * Extracts the JWT token from LangGraph tool config.
 *
 * LangGraph can place the token in different locations depending on the
 * framework version and how the run was triggered:
 *   1. config.configurable.token  — standard configurable field
 *   2. config.context.token       — newer createAgent contextSchema field
 *   3. config.configurable.__pregel_scratchpad.currentTaskInput.token — state
 *
 * Throws if no token is found in any location.
 */
export function extractToken(config: RunnableConfig | undefined): string {
  const cfg = config?.configurable as Record<string, unknown> | undefined;
  const ctx = (config as Record<string, unknown> | undefined)?.context as
    | Record<string, unknown>
    | undefined;
  const taskInput = (cfg?.__pregel_scratchpad as Record<string, unknown>)?.currentTaskInput as
    | Record<string, unknown>
    | undefined;

  const token =
    (cfg?.token as string | undefined) ??
    (ctx?.token as string | undefined) ??
    (taskInput?.token as string | undefined);

  if (!token) throw new Error("No auth token in configurable");
  return token;
}
