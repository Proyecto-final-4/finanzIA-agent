import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const createCategory = tool(
  async (input, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    console.log("[create_category] payload:", JSON.stringify(input, null, 2));

    const res = await fetch(`${endpoint}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[create_category] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to create category: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[create_category] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
    name: "create_category",
    description: `
Creates a new category that the user can assign to transactions.

Use this when the user wants to track a new spending or income area that doesn't match any existing category.
Ask for the name and optionally a description before calling.

Example call: { "name": "Gym", "description": "Monthly membership and sports expenses" }
`.trim(),
    schema: z.object({
      name: z.string().describe("Name of the category"),
      type: z
        .enum(["INCOME", "EXPENSE", "BOTH"])
        .describe("Category type: INCOME, EXPENSE, or BOTH"),
      color: z
        .string()
        .optional()
        .describe("Optional hex color code, e.g. #FF5733"),
      icon: z.string().optional().describe("Optional icon name or emoji"),
    }),
  },
);
