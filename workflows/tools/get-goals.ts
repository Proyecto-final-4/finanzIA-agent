import * as z from "zod";
import { defineBackendTool } from "./_http-client";

export const getGoals = defineBackendTool({
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
  method: "GET",
  buildPath: () => "/goals",
});
