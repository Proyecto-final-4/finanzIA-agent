import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const createGoal = defineBackendTool({
  name: "create_goal",
  description: `
Creates a new savings goal for the authenticated user.

Use when the user wants to set a financial target (vacation, emergency fund, purchase, etc.).
Ask for name and target amount before calling. targetDate and description are optional.

Example call:
{
  "name": "Laptop",
  "targetAmount": 2000000,
  "targetDate": "2026-08-01",
  "description": "MacBook for work"
}
`.trim(),
  schema: z.object({
    name: z.string().describe("Short name for the savings goal"),
    targetAmount: z
      .number()
      .positive()
      .describe("Target amount to save (positive number)"),
    targetDate: z
      .string()
      .optional()
      .describe("Optional target date in YYYY-MM-DD format"),
    description: z
      .string()
      .optional()
      .describe("Optional longer description of the goal"),
  }),
  method: "POST",
  buildPath: () => "/goals",
  buildBody: (input) => input,
});
