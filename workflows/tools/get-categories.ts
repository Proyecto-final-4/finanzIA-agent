import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const getCategories = defineBackendTool({
  name: "get_categories",
  description: `
Returns all categories that belong to the authenticated user.

ALWAYS call this tool before create_transaction or any tool that needs a categoryId.
Never assume a categoryId — use the 'id' field from this response.

Example response:
[
  { "id": "a1b2c3d4-...", "name": "Salary", "description": "Monthly salary" },
  { "id": "e5f6g7h8-...", "name": "Groceries", "description": "Food and supermarket" }
]
`.trim(),
  schema: z.object({}),
  method: "GET",
  buildPath: () => "/categories",
});
