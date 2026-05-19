import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const getBudgets = tool(
  async (_input, config) => {
    const token = extractToken(config);

    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;
    const url = `${endpoint}/budgets`;

    console.log("[get_budgets] url:", url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[get_budgets] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to fetch budgets: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[get_budgets] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
    name: "get_budgets",
    description: `
Returns all spending budgets for the authenticated user.

Use this first to list budgets, find budget IDs, or match a category name to an existing budget.
Each item includes id, categoryId, categoryName, amountLimit, period, startDate, endDate, and isActive.

Example response:
[
  {
    "id": "a1b2c3d4-...",
    "categoryId": "e5f6g7h8-...",
    "categoryName": "Groceries",
    "amountLimit": 500000,
    "period": "MONTHLY",
    "startDate": "2026-05-01",
    "endDate": null,
    "isActive": true
  }
]
`.trim(),
    schema: z.object({}),
  },
);
