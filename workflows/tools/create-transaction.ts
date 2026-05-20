import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const createTransaction = defineBackendTool({
  name: "create_transaction",
  description: `
Records a new financial transaction for the authenticated user.

REQUIRED pre-step: call get_categories first and pick the matching category UUID.
Never invent or guess categoryId — it must come from get_categories.

Rules:
- Infer type from context: INCOME for salary/deposits, EXPENSE for purchases/bills.
- transactionDate must be YYYY-MM-DD. Use today's date if the user doesn't specify.
- Ask for missing fields one at a time before calling this tool.
- Show the user a summary and wait for confirmation before calling.

Example call:
{
  "categoryId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 1500,
  "type": "INCOME",
  "transactionDate": "2026-04-08",
  "description": "April salary",
  "notes": "Transferred to savings"
}
`.trim(),
  schema: z.object({
    categoryId: z
      .string()
      .uuid()
      .describe("UUID of the category for this transaction"),
    amount: z
      .number()
      .positive()
      .describe("Transaction amount (positive number)"),
    type: z
      .enum(["INCOME", "EXPENSE"])
      .describe("INCOME or EXPENSE — infer from context"),
    transactionDate: z.string().describe("Date in YYYY-MM-DD format"),
    description: z.string().describe("Short description of the transaction"),
    notes: z.string().optional().describe("Optional additional notes"),
  }),
  method: "POST",
  buildPath: () => "/transactions",
  buildBody: (input) => input,
});
