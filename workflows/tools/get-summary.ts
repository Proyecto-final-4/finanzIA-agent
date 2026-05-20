import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const getSummary = defineBackendTool({
  name: "get_summary",
  description: `
Returns a financial summary for the user.

Response shape (do not expect byCategory):
- totalIncome, totalExpense, balance
- savingsRate: fraction of income saved (balance / income); cite when asked about saving habits
- incomeByCategory: array of { categoryId, categoryName, total, percentage } for income
- expenseByCategory: same structure for expenses; use percentage for "what share of spending is X?"

Use this tool when the user asks for:
- An overview of their finances
- How much they spent or earned in a period
- Top spending or earning categories (expenseByCategory / incomeByCategory)
- Savings rate or how efficiently they are saving
- Recommendations or analysis based on their spending
- Whether they can afford something or how to save more

For period-over-period comparisons, use get_trends instead.

Optionally filter by date range. Defaults to all time if no range is given.
Prefer filtering to the current month for recent analysis.

Example calls:
- Current month: { "from": "2026-05-01", "to": "2026-05-31" }
- All time: {}
`.trim(),
  schema: z.object({
    from: z.string().optional().describe("Start date in YYYY-MM-DD format"),
    to: z.string().optional().describe("End date in YYYY-MM-DD format"),
  }),
  method: "GET",
  // Construye la URL con query params opcionales de rango de fechas
  buildPath: (input) => {
    const params = new URLSearchParams();
    if (input.from) params.set("from", input.from);
    if (input.to) params.set("to", input.to);
    return `/summary?${params.toString()}`;
  },
});
