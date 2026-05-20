import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import type { RunnableConfig } from "@langchain/core/runnables";
import * as z from "zod";

import { extractToken } from "../tools/_auth";
import { getBudgets } from "../tools/get-budgets";
import { createBudget } from "../tools/create-budget";
import { updateBudget } from "../tools/update-budget";
import { deleteBudget } from "../tools/delete-budget";
import { getBudgetStatus } from "../tools/get-budget-status";
import { createSpecialistAgent } from "./_agent-factory";
import { formatAgentReply } from "./_format-reply";

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
- categoryId must be a valid UUID. The coordinator is responsible for resolving category names to UUIDs before delegating.
  If the categoryId is missing from the query, do NOT ask the user — return a message to the coordinator stating which category name needs its UUID resolved.
- Use amounts and dates exactly as the query provides; default startDate to today only when reasonable.
- Return a concise summary with numbers (spent, remaining, percentage) when reporting status.
- If the query starts with [USER_CONFIRMED], execute create/update/delete operations without asking for confirmation.
`.trim();

export const budgetsAgent = createSpecialistAgent({
  name: "budgets_agent",
  tools: budgetTools,
  systemPrompt: BUDGETS_AGENT_PROMPT,
  model,
  contextSchema: z.object({
    token: z
      .string()
      .optional()
      .describe("JWT token for backend authentication"),
  }),
});

/**
 * Tool wrapper para que el coordinador financiero delegue tareas
 * de presupuestos al agente especialista.
 * Equivalente a createAgentAsTool — propaga el JWT vía configurable.
 */
export const budgetsTool = tool(
  async ({ query }, config: RunnableConfig | undefined) => {
    const token = extractToken(config);

    const result = await budgetsAgent.invoke(
      { messages: [{ role: "user", content: query }] },
      { configurable: { token } },
    );

    return formatAgentReply(
      result.messages,
      "Budgets sub-agent returned no response.",
    );
  },
  {
    name: "budgets_agent",
    description: `
Delegates to the budgets specialist. Use when the user talks about budgets, spending limits,
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
