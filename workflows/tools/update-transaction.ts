import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const updateTransaction = defineBackendTool({
  name: "update_transaction",
  description: `
Updates an existing transaction. Only the fields provided will be changed.

Pre-steps:
1. Call get_transaction_detail to fetch the current values.
2. If changing the category, call get_categories first to get the new categoryId.
3. Show the user a summary of what will change and wait for confirmation before calling.

Rules:
- At least one optional field must be provided.
- categoryId must come from get_categories — never guess it.
- The new category type must match the transaction type (INCOME/EXPENSE).
- transactionDate must be YYYY-MM-DD format.

Example call:
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 2000,
  "description": "Updated description"
}
`.trim(),
  schema: z.object({
    id: z.string().uuid().describe("UUID of the transaction to update"),
    categoryId: z
      .string()
      .uuid()
      .optional()
      .describe("New category UUID — must come from get_categories"),
    amount: z.number().positive().optional().describe("New amount"),
    type: z.enum(["INCOME", "EXPENSE"]).optional().describe("New type"),
    transactionDate: z
      .string()
      .optional()
      .describe("New date in YYYY-MM-DD format"),
    description: z.string().optional().describe("New description"),
    notes: z.string().optional().describe("New notes"),
  }),
  method: "PUT",
  buildPath: (input) => `/transactions/${input.id}`,
  // Send fields without id (id is already in the URL)
  buildBody: ({ id: _id, ...fields }) => fields,
});
