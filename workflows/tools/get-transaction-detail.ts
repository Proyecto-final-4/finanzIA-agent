import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const getTransactionDetail = defineBackendTool({
  name: "get_transaction_detail",
  description: `
Fetches full details for a single transaction by its UUID.

Use this when the user asks for details about a specific transaction.
Pre-step: call get_transactions to find the UUID first.

Example call: { "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
`.trim(),
  schema: z.object({
    id: z.string().uuid().describe("UUID of the transaction to fetch"),
  }),
  method: "GET",
  buildPath: (input) => `/transactions/${input.id}`,
});
