import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const createGoal = tool(
  async (input, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    console.log("[create_goal] payload:", JSON.stringify(input, null, 2));

    const res = await fetch(`${endpoint}/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[create_goal] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to create goal: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[create_goal] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
    name: "create_goal",
    description: `
Creates a new savings goal for the authenticated user.

Use when the user wants to set a financial target (vacation, emergency fund, purchase, etc.).
Ask for name and target amount before calling. targetDate and description are optional.

Example call:
{
  "name": "Laptop",
  "targetAmount": 2000000,
  "targetDate": "2026-08-01",
  "description": "MacBook for work"
}
`.trim(),
    schema: z.object({
      name: z.string().describe("Short name for the savings goal"),
      targetAmount: z
        .number()
        .positive()
        .describe("Target amount to save (positive number)"),
      targetDate: z
        .string()
        .optional()
        .describe("Optional target date in YYYY-MM-DD format"),
      description: z
        .string()
        .optional()
        .describe("Optional longer description of the goal"),
    }),
  },
);
