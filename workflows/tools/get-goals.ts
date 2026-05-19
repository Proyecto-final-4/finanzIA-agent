import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const getGoals = tool(
  async (_input, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;
    const url = `${endpoint}/goals`;

    console.log("[get_goals] url:", url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[get_goals] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to fetch goals: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[get_goals] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
    name: "get_goals",
    description: `
Returns all savings goals for the authenticated user.

ALWAYS call this before update_goal or delete_goal to obtain the correct goal UUID.
Use the 'id' field from the response — never invent goal IDs.

Example response:
[
  {
    "id": "a1b2c3d4-...",
    "name": "Laptop",
    "targetAmount": 2000000,
    "currentAmount": 500000,
    "targetDate": "2026-08-01",
    "isCompleted": false
  }
]
`.trim(),
    schema: z.object({}),
  },
);
