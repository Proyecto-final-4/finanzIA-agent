import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const deleteBudget = tool(
  async ({ id }, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    console.log("[delete_budget] payload:", JSON.stringify({ id }, null, 2));

    const res = await fetch(`${endpoint}/budgets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[delete_budget] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to delete budget ${id}: ${res.status} — ${text}`,
      });
    }

    console.log(`[delete_budget] budget ${id} deleted successfully`);
    return JSON.stringify({ success: true, id });
  },
  {
    name: "delete_budget",
    description: `
Permanently deletes a budget by UUID.

Pre-step: call get_budgets to confirm the budget id.
ALWAYS ask the user for explicit confirmation before calling — this action cannot be undone.

Example call: { "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
`.trim(),
    schema: z.object({
      id: z.string().uuid().describe("UUID of the budget to delete"),
    }),
  },
);
