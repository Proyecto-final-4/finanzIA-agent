import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const updateBudget = defineBackendTool({
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
  method: "PUT",
  buildPath: (input) => `/budgets/${input.id}`,
  // Send fields without id (id is already in the URL)
  buildBody: ({ id: _id, ...fields }) => fields,
});
