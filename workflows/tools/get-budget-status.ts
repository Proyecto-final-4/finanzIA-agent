import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const getBudgetStatus = tool(
  async ({ id }, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;
    const url = `${endpoint}/budgets/${id}/status`;

    console.log("[get_budget_status] url:", url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[get_budget_status] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to fetch budget status ${id}: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[get_budget_status] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
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
  },
);
