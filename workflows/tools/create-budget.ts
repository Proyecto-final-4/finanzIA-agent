import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const createBudget = tool(
  async (input, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    console.log("[create_budget] payload:", JSON.stringify(input, null, 2));

    const res = await fetch(`${endpoint}/budgets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[create_budget] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to create budget: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[create_budget] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
    name: "create_budget",
    description: `
Creates a new spending budget for a category.

REQUIRED: categoryId (UUID), amountLimit (positive number), period (DAILY/WEEKLY/MONTHLY), startDate (YYYY-MM-DD).
Optional: endDate (YYYY-MM-DD), isActive (defaults to true).

Pre-step: ensure categoryId is a valid UUID for the target category.
Ask for missing fields before calling. Confirm amount and period with the user.

Example call:
{
  "categoryId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amountLimit": 500000,
  "period": "MONTHLY",
  "startDate": "2026-05-01"
}
`.trim(),
    schema: z.object({
      categoryId: z
        .string()
        .uuid()
        .describe("UUID of the category this budget applies to"),
      amountLimit: z
        .number()
        .positive()
        .describe("Maximum amount allowed for the budget period"),
      period: z
        .enum(["DAILY", "WEEKLY", "MONTHLY"])
        .describe("Budget period: DAILY, WEEKLY, or MONTHLY"),
      startDate: z
        .string()
        .describe("Budget start date in YYYY-MM-DD format"),
      endDate: z
        .string()
        .optional()
        .describe("Optional end date in YYYY-MM-DD format"),
      isActive: z
        .boolean()
        .optional()
        .describe("Whether the budget is active (default true)"),
    }),
  },
);
