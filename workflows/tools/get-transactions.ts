import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const getTransactions = defineBackendTool({
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
    to: z.string().optional().describe("End date filter in YYYY-MM-DD format"),
    page: z.number().int().min(0).optional().describe("0-indexed page number"),
    size: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe("Number of results per page (default 20)"),
  }),
  method: "GET",
  // Construye la URL con query params opcionales
  buildPath: (input) => {
    const params = new URLSearchParams();
    if (input.type) params.set("type", input.type);
    if (input.categoryId !== undefined)
      params.set("categoryId", String(input.categoryId));
    if (input.from) params.set("from", input.from);
    if (input.to) params.set("to", input.to);
    if (input.page !== undefined) params.set("page", String(input.page));
    if (input.size !== undefined) params.set("size", String(input.size));
    return `/transactions?${params.toString()}`;
  },
});
