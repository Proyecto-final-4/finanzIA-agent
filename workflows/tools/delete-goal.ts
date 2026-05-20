import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const deleteGoal = defineBackendTool({
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
  method: "DELETE",
  buildPath: (input) => `/goals/${input.id}`,
  // DELETE devuelve 204 No Content — construimos la respuesta manualmente
  buildSuccessResult: (input) => ({ success: true, id: input.id }),
});
