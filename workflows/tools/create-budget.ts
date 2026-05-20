import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const createBudget = defineBackendTool({
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
    startDate: z.string().describe("Budget start date in YYYY-MM-DD format"),
    endDate: z
      .string()
      .optional()
      .describe("Optional end date in YYYY-MM-DD format"),
    isActive: z
      .boolean()
      .optional()
      .describe("Whether the budget is active (default true)"),
  }),
  method: "POST",
  buildPath: () => "/budgets",
  buildBody: (input) => input,
});
