import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const ragSearch = tool(
  async (input, config) => {
    const token = extractToken(config);
    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    console.log("[rag_search] payload:", JSON.stringify(input, null, 2));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let res: Response;
    try {
      res = await fetch(`${endpoint}/rag/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      const msg =
        err instanceof Error && err.name === "AbortError"
          ? "rag_search timed out after 10 seconds"
          : String(err);
      console.error("[rag_search] fetch error:", msg);
      return JSON.stringify({ error: msg });
    }
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      console.error(`[rag_search] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to search transactions: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[rag_search] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
    name: "rag_search",
    description: `
Performs a semantic search on the user's transactions using natural language.
Use this when the user references transactions by meaning rather than exact values,
or when you need to find specific past transactions to provide context for recommendations.

Examples of when to use:
- "cuánto gasté en comida el mes pasado" (not a filter — a concept search)
- "mis gastos de entretenimiento"
- Finding transactions related to a goal or habit the user mentions

Do NOT use this for simple list/filter requests — use get_transactions for those.

Example call: { "query": "gastos de alimentación y restaurantes", "limit": 10 }
`.trim(),
    schema: z.object({
      query: z
        .string()
        .describe("Natural language description of what to search for"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe("Maximum number of results to return (default 10)"),
    }),
  },
);
