import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const getTransactionDetail = tool(
  async ({ id }, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    console.log("[get_transaction_detail] id:", id);

    const res = await fetch(`${endpoint}/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[get_transaction_detail] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to fetch transaction ${id}: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log(
      "[get_transaction_detail] response:",
      JSON.stringify(data, null, 2),
    );
    return JSON.stringify(data);
  },
  {
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
  },
);
