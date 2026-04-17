import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const getCategories = tool(
  async (_input, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;
    const url = `${endpoint}/categories`;

    console.log("[get_categories] url:", url);
    console.log("[get_categories] token (first 20 chars):", token.slice(0, 20));

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[get_categories] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to fetch categories: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[get_categories] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
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
  },
);
