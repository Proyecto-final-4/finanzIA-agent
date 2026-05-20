import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const getBudgets = defineBackendTool({
  name: "get_budgets",
  description: `
Returns all spending budgets for the authenticated user.

Use this first to list budgets, find budget IDs, or match a category name to an existing budget.
Each item includes id, categoryId, categoryName, amountLimit, period, startDate, endDate, and isActive.

Example response:
[
  {
    "id": "a1b2c3d4-...",
    "categoryId": "e5f6g7h8-...",
    "categoryName": "Groceries",
    "amountLimit": 500000,
    "period": "MONTHLY",
    "startDate": "2026-05-01",
    "endDate": null,
    "isActive": true
  }
]
`.trim(),
  schema: z.object({}),
  method: "GET",
  buildPath: () => "/budgets",
});
