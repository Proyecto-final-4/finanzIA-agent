import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { extractToken } from "./_auth";

export const getSummary = tool(
  async (input, config) => {
    const token = extractToken(config);
    const endpoint = process.env.BACKEND_JAVA_ENDPOINT;

    const params = new URLSearchParams();
    if (input.from) params.set("from", input.from);
    if (input.to) params.set("to", input.to);

    const url = `${endpoint}/summary?${params.toString()}`;
    console.log("[get_summary] url:", url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[get_summary] error ${res.status}:`, text);
      return JSON.stringify({
        error: `Failed to fetch summary: ${res.status} — ${text}`,
      });
    }

    const data = await res.json();
    console.log("[get_summary] response:", JSON.stringify(data, null, 2));
    return JSON.stringify(data);
  },
  {
    name: "get_summary",
    description: `
Returns a financial summary for the user: total income, total expenses, balance, and a breakdown by category.

Use this tool when the user asks for:
- An overview of their finances
- How much they spent or earned in a period
- Which categories they spend the most on
- Recommendations or analysis based on their spending
- Whether they can afford something or how to save more

Optionally filter by date range. Defaults to all time if no range is given.
Prefer filtering to the current month for recent analysis.

Example calls:
- Current month: { "from": "2026-05-01", "to": "2026-05-31" }
- All time: {}
`.trim(),
    schema: z.object({
      from: z.string().optional().describe("Start date in YYYY-MM-DD format"),
      to: z.string().optional().describe("End date in YYYY-MM-DD format"),
    }),
  },
);
