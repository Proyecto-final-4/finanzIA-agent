import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const updateCategory = defineBackendTool({
  name: "update_category",
  description: `
Renames or updates the description of an existing category.

Pre-step: call get_categories to get the correct UUID before calling this.
At least one of 'name' or 'description' must be provided.

Example call: { "id": "a1b2c3d4-...", "name": "Food & Groceries" }
`.trim(),
  schema: z.object({
    id: z.string().uuid().describe("UUID of the category to update"),
    name: z.string().optional().describe("New name for the category"),
    description: z
      .string()
      .optional()
      .describe("New description for the category"),
  }),
  method: "PUT",
  buildPath: (input) => `/categories/${input.id}`,
  // Send fields without id (id is already in the URL)
  buildBody: ({ id: _id, ...fields }) => fields,
});
