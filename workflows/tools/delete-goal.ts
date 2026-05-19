import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const deleteGoal = tool(
  async ({ id }, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    console.log("[delete_goal] payload:", JSON.stringify({ id }, null, 2));

    const res = await fetch(`${endpoint}/goals/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[delete_goal] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to delete goal ${id}: ${res.status} — ${text}`,
      });
    }

    console.log(`[delete_goal] goal ${id} deleted successfully`);
    return JSON.stringify({ success: true, id });
  },
  {
    name: "delete_goal",
    description: `
Permanently deletes a savings goal by UUID.

Pre-step: call get_goals to confirm the UUID before calling this.
ALWAYS ask the user for explicit confirmation before deleting — this cannot be undone.

Example call: { "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
`.trim(),
    schema: z.object({
      id: z.string().uuid().describe("UUID of the goal to delete"),
    }),
  },
);
