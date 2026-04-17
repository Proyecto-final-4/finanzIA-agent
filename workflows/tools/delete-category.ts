import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const deleteCategory = tool(
  async ({ id }, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    console.log("[delete_category] payload:", JSON.stringify({ id }, null, 2));

    const res = await fetch(`${endpoint}/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[delete_category] error ${res.status}:`, text);
      return JSON.stringify({ error: `Failed to delete category ${id}: ${res.status} — ${text}` });
    }

    console.log(`[delete_category] category ${id} deleted successfully`);
    return JSON.stringify({ success: true, id });
  },
  {
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
  },
);
