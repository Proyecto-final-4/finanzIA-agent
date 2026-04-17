import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const getTransactions = tool(
  async (input, config) => {
    const token = extractToken(config);
    const cfg = config?.configurable as Record<string, unknown> | undefined;

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;
    const params = new URLSearchParams();

    if (input.type) params.set("type", input.type);
    if (input.categoryId !== undefined)
      params.set("categoryId", String(input.categoryId));
    if (input.from) params.set("from", input.from);
    if (input.to) params.set("to", input.to);
    if (input.page !== undefined) params.set("page", String(input.page));
    if (input.size !== undefined) params.set("size", String(input.size));

    const url = `${endpoint}/transactions?${params.toString()}`;
    console.log("[get_transactions] url:", url);
    console.log(
      "[get_transactions] token (first 20 chars):",
      token?.slice(0, 20),
    );
    console.log(
      "[get_transactions] configurable keys:",
      Object.keys(cfg ?? {}),
    );
    console.log("[get_transactions] payload:", JSON.stringify(input, null, 2));

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[get_transactions] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to fetch transactions: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[get_transactions] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
    name: "get_transactions",
    description: `
Returns a paginated list of the user's transactions with optional filters.

Guidelines:
- Default to the current month (from/to) if the user doesn't specify a range.
- Apply 'type' filter when the user says "my expenses" or "what I earned".
- Use 'categoryId' (UUID from get_categories) only when filtering by category.
- Omit all filters to get the most recent transactions.

Example calls:
- All transactions this month: { "from": "2026-04-01", "to": "2026-04-30" }
- Only expenses: { "type": "EXPENSE", "from": "2026-04-01", "to": "2026-04-30" }
- By category: { "categoryId": "a1b2c3d4-...", "from": "2026-04-01", "to": "2026-04-30" }
- Second page: { "page": 1, "size": 20 }
`.trim(),
    schema: z.object({
      type: z
        .enum(["INCOME", "EXPENSE"])
        .optional()
        .describe("Filter by transaction type"),
      categoryId: z
        .string()
        .uuid()
        .optional()
        .describe("Filter by category UUID"),
      from: z
        .string()
        .optional()
        .describe("Start date filter in YYYY-MM-DD format"),
      to: z
        .string()
        .optional()
        .describe("End date filter in YYYY-MM-DD format"),
      page: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("0-indexed page number"),
      size: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe("Number of results per page (default 20)"),
    }),
  },
);
