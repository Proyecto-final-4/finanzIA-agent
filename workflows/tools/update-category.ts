import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const updateCategory = tool(
  async ({ id, ...body }, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    console.log("[update_category] payload:", JSON.stringify({ id, ...body }, null, 2));

    const res = await fetch(`${endpoint}/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[update_category] error ${res.status}:`, text);
      return JSON.stringify({ error: `Failed to update category ${id}: ${res.status} — ${text}` });
    }

    const data = await res.json();
    console.log("[update_category] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
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
      description: z.string().optional().describe("New description for the category"),
    }),
  },
);
