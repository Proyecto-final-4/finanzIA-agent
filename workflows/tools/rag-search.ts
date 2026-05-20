import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const ragSearch = defineBackendTool({
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
  method: "POST",
  buildPath: () => "/rag/search",
  buildBody: (input) => input,
  // 10s timeout for RAG searches that may be slow
  timeoutMs: 10_000,
});
