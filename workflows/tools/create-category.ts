import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const createCategory = defineBackendTool({
  name: "create_category",
  description: `
Creates a new category that the user can assign to transactions.

Use this when the user wants to track a new spending or income area that doesn't match any existing category.
Ask for the name and optionally a description before calling.

Example call: { "name": "Gym", "description": "Monthly membership and sports expenses" }
`.trim(),
  schema: z.object({
    name: z.string().describe("Name of the category"),
    type: z
      .enum(["INCOME", "EXPENSE", "BOTH"])
      .describe("Category type: INCOME, EXPENSE, or BOTH"),
    color: z
      .string()
      .optional()
      .describe("Optional hex color code, e.g. #FF5733"),
    icon: z.string().optional().describe("Optional icon name or emoji"),
  }),
  method: "POST",
  buildPath: () => "/categories",
  buildBody: (input) => input,
});
