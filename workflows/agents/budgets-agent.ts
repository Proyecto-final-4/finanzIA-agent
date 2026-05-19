import { tool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";

import { extractToken } from "../tools/_auth";
import { getBudgets } from "../tools/get-budgets";
import { createBudget } from "../tools/create-budget";
import { updateBudget } from "../tools/update-budget";
import { deleteBudget } from "../tools/delete-budget";
import { getBudgetStatus } from "../tools/get-budget-status";

const model = new ChatOpenAI({
  model: "gpt-5.4-mini-2026-03-17",
  temperature: 0,
});

const budgetTools = [
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
];

const BUDGETS_AGENT_PROMPT = `
You are the budgets specialist for finanzIA. You manage spending limits and track progress against them.

Your tools:
- get_budgets: list all budgets
- create_budget: create a new budget (needs categoryId, amountLimit, period, startDate)
- update_budget: change an existing budget
- delete_budget: remove a budget (confirm with the user first)
- get_budget_status: show spent, remaining, and percentage for a budget id

Rules:
- Call get_budgets before create/update/delete when you need ids or to avoid duplicates.
- For progress questions ("how am I doing", "how much left"), use get_budget_status after resolving the budget id.
- categoryId must be a valid UUID; if missing, say what you need — do not invent ids.
- Use amounts and dates exactly as the user provides; default startDate to today only when reasonable.
- Return a concise summary with numbers (spent, remaining, percentage) when reporting status.
`.trim();

export const budgetsAgent = createAgent({
  model,
  tools: budgetTools,
  name: "budgets_agent",
  systemPrompt: BUDGETS_AGENT_PROMPT,
  contextSchema: z.object({
    token: z
      .string()
      .optional()
      .describe("JWT token for backend authentication"),
  }),
});

function formatAgentReply(messages: { content: unknown }[]): string {
  const last = messages.at(-1);
  if (!last) return "El sub-agente de presupuestos no devolvió respuesta.";

  const { content } = last;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (block && typeof block === "object" && "text" in block) {
          return String((block as { text: unknown }).text);
        }
        return JSON.stringify(block);
      })
      .join("\n");
  }
  return JSON.stringify(content);
}

/**
 * Tool wrapper so the financial coordinator can delegate budget tasks.
 * Equivalent to createAgentAsTool — propagates JWT via configurable.
 */
export const budgetsTool = tool(
  async ({ query }, config) => {
    const token = extractToken(config);

    const result = await budgetsAgent.invoke(
      { messages: [{ role: "user", content: query }] },
      { configurable: { token } },
    );

    return formatAgentReply(result.messages);
  },
  {
    name: "budgets_agent",
    description: `
Delegates to the budgets specialist. Use when the user talks about presupuestos, spending limits,
how much they have left in a category, creating/updating/deleting budgets, or comparing spending vs a limit.

Pass a clear query with category names, amounts, periods, and any budget ids already known.

Examples:
- "List all my budgets"
- "Create a monthly budget of 500000 for categoryId ... starting 2026-05-01"
- "How is my groceries budget doing this month?"
`.trim(),
    schema: z.object({
      query: z
        .string()
        .describe(
          "Task for the budgets agent: list, create, update, delete budgets, or check status",
        ),
    }),
  },
);
