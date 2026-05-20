import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const deleteBudget = defineBackendTool({
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
  method: "DELETE",
  buildPath: (input) => `/budgets/${input.id}`,
  // DELETE devuelve 204 No Content — construimos la respuesta manualmente
  buildSuccessResult: (input) => ({ success: true, id: input.id }),
});
