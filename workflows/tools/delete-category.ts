import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const deleteCategory = defineBackendTool({
  name: "delete_category",
  description: `
Permanently deletes a category by UUID.

Pre-step: call get_categories to confirm the UUID before calling this.
ALWAYS ask the user for explicit confirmation before calling — this action cannot be undone.

Example call: { "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
`.trim(),
  schema: z.object({
    id: z.string().uuid().describe("UUID of the category to delete"),
  }),
  method: "DELETE",
  buildPath: (input) => `/categories/${input.id}`,
  // DELETE devuelve 204 No Content — construimos la respuesta manualmente
  buildSuccessResult: (input) => ({ success: true, id: input.id }),
});
