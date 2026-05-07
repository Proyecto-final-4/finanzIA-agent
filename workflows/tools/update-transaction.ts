import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const updateTransaction = tool(
  async ({ id, ...fields }, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;
    console.log(
      "[update_transaction] payload:",
      JSON.stringify({ id, ...fields }, null, 2),
    );

    const res = await fetch(`${endpoint}/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fields),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[update_transaction] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to update transaction: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log(
      "[update_transaction] response:",
      JSON.stringify(data, null, 2),
    );
    return JSON.stringify(data);
  },
  {
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
  },
);
