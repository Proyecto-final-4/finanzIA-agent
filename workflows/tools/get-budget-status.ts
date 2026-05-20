import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const getBudgetStatus = defineBackendTool({
  name: "get_budget_status",
  description: `
Returns spending progress for a budget in the current period.

Pre-step: call get_budgets to find the budget id (e.g. by category name).

Response fields:
- spent: amount already spent in the period
- remaining: amount left before hitting the limit
- percentage: share of the limit used (0–100+)
- periodStart, periodEnd: active period dates

Use when the user asks how they are doing vs a budget, how much is left, or if they are over limit.

Example call: { "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
`.trim(),
  schema: z.object({
    id: z.string().uuid().describe("UUID of the budget to check"),
  }),
  method: "GET",
  buildPath: (input) => `/budgets/${input.id}/status`,
});
