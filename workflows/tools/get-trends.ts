import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const getTrends = defineBackendTool({
  name: "get_trends",
  description: `
Compares two time periods and returns period-over-period trends.

Response shape:
- current / previous: same structure as get_summary (totalIncome, totalExpense, balance, savingsRate, incomeByCategory, expenseByCategory)
- diff.incomeChange, diff.expenseChange, diff.balanceChange: each has absolute and percentage deltas
- diff.byCategory: per-category currentTotal, previousTotal, change, changePercentage

Use when the user asks:
- Whether they spent or earned more than another period
- How finances evolved month over month
- Category-level trend analysis (e.g. "did food spending go up vs last month?")

All four date parameters are required. Use full calendar months when comparing months.

Example (May vs April 2026):
{ "currentFrom": "2026-05-01", "currentTo": "2026-05-31", "previousFrom": "2026-04-01", "previousTo": "2026-04-30" }
`.trim(),
  schema: z.object({
    currentFrom: z
      .string()
      .describe("Start date of the current period in YYYY-MM-DD format"),
    currentTo: z
      .string()
      .describe("End date of the current period in YYYY-MM-DD format"),
    previousFrom: z
      .string()
      .describe(
        "Start date of the previous period to compare against in YYYY-MM-DD format",
      ),
    previousTo: z
      .string()
      .describe(
        "End date of the previous period to compare against in YYYY-MM-DD format",
      ),
  }),
  method: "GET",
  // All parameters are required for this endpoint
  buildPath: (input) => {
    const params = new URLSearchParams({
      currentFrom: input.currentFrom,
      currentTo: input.currentTo,
      previousFrom: input.previousFrom,
      previousTo: input.previousTo,
    });
    return `/summary/trends?${params.toString()}`;
  },
});
