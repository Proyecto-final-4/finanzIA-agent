import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const updateGoal = defineBackendTool({
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
  method: "PUT",
  buildPath: (input) => `/goals/${input.id}`,
  // Send fields without id (id is already in the URL)
  buildBody: ({ id: _id, ...fields }) => fields,
});
