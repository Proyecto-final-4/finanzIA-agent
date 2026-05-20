import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const deleteTransaction = defineBackendTool({
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
  method: "DELETE",
  buildPath: (input) => `/transactions/${input.id}`,
  // DELETE devuelve 204 No Content — construimos la respuesta manualmente
  buildSuccessResult: (input) => ({ success: true, id: input.id }),
});
