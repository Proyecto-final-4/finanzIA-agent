import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const updateBudget = tool(
  async ({ id, ...body }, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    console.log(
      "[update_budget] payload:",
      JSON.stringify({ id, ...body }, null, 2),
    );

    const res = await fetch(`${endpoint}/budgets/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[update_budget] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to update budget ${id}: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[update_budget] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
    name: "update_budget",
    description: `
Updates an existing budget by UUID.

Pre-step: call get_budgets to obtain the correct budget id.
Provide at least one field to change besides id.

Example call:
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amountLimit": 600000,
  "period": "MONTHLY"
}
`.trim(),
    schema: z.object({
      id: z.string().uuid().describe("UUID of the budget to update"),
      categoryId: z.string().uuid().optional().describe("New category UUID"),
      amountLimit: z
        .number()
        .positive()
        .optional()
        .describe("New spending limit"),
      period: z
        .enum(["DAILY", "WEEKLY", "MONTHLY"])
        .optional()
        .describe("New budget period"),
      startDate: z
        .string()
        .optional()
        .describe("New start date in YYYY-MM-DD format"),
      endDate: z
        .string()
        .optional()
        .describe("New end date in YYYY-MM-DD format"),
      isActive: z.boolean().optional().describe("Whether the budget is active"),
    }),
  },
);
