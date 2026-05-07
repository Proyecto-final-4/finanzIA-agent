import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const deleteTransaction = tool(
  async ({ id }, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;
    console.log(
      "[delete_transaction] payload:",
      JSON.stringify({ id }, null, 2),
    );

    const res = await fetch(`${endpoint}/transactions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[delete_transaction] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to delete transaction: ${res.status} — ${text}`,
      });
    }

    console.log(`[delete_transaction] transaction ${id} deleted successfully`);
    return JSON.stringify({ success: true, id });
  },
  {
    name: "delete_transaction",
    description: `
Permanently deletes a transaction by UUID.

Pre-steps:
1. Call get_transactions (or get_transaction_detail) to confirm the UUID and show the user which transaction will be deleted.
2. ALWAYS ask the user for explicit confirmation before calling — this action cannot be undone.

Example call: { "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
`.trim(),
    schema: z.object({
      id: z.string().uuid().describe("UUID of the transaction to delete"),
    }),
  },
);
