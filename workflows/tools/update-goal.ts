import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const updateGoal = tool(
  async ({ id, ...body }, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    console.log(
      "[update_goal] payload:",
      JSON.stringify({ id, ...body }, null, 2),
    );

    const res = await fetch(`${endpoint}/goals/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[update_goal] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to update goal ${id}: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[update_goal] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
    name: "update_goal",
    description: `
Updates an existing savings goal by UUID.

Pre-step: call get_goals to obtain the correct goal id.
You may update any combination of fields. currentAmount and isCompleted can be updated independently
(e.g. record progress without changing the target, or mark a goal as completed).

Example — record savings progress:
{ "id": "a1b2c3d4-...", "currentAmount": 500000 }

Example — mark as completed:
{ "id": "a1b2c3d4-...", "isCompleted": true }
`.trim(),
    schema: z.object({
      id: z.string().uuid().describe("UUID of the goal to update"),
      name: z.string().optional().describe("New name for the goal"),
      description: z.string().optional().describe("New description"),
      targetAmount: z
        .number()
        .positive()
        .optional()
        .describe("New target amount"),
      currentAmount: z
        .number()
        .min(0)
        .optional()
        .describe("Amount saved so far toward this goal"),
      targetDate: z
        .string()
        .optional()
        .describe("New target date in YYYY-MM-DD format"),
      isCompleted: z
        .boolean()
        .optional()
        .describe("Whether the goal has been reached"),
    }),
  },
);
