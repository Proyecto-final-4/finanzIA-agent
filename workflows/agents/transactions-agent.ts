import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import type { RunnableConfig } from "@langchain/core/runnables";
import * as z from "zod";

import { extractToken } from "../tools/_auth";
import { createTransaction } from "../tools/create-transaction";
import { updateTransaction } from "../tools/update-transaction";
import { deleteTransaction } from "../tools/delete-transaction";
import { getTransactions } from "../tools/get-transactions";
import { getTransactionDetail } from "../tools/get-transaction-detail";
import { getCategories } from "../tools/get-categories";
import { createCategory } from "../tools/create-category";
import { updateCategory } from "../tools/update-category";
import { deleteCategory } from "../tools/delete-category";
import { createSpecialistAgent } from "./_agent-factory";
import { formatAgentReply } from "./_format-reply";

const model = new ChatOpenAI({
  model: "gpt-5.5-2026-04-23",
  temperature: 0,
});

const transactionTools = [
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
  getTransactionDetail,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
];

const TRANSACTIONS_AGENT_PROMPT = `
You are the transactions and categories specialist for finanzIA.

Your tools:
- create_transaction, update_transaction, delete_transaction
- get_transactions, get_transaction_detail
- get_categories, create_category, update_category, delete_category

## Pre-authorized actions
If the query starts with **[USER_CONFIRMED]**, the coordinator has already obtained the user's explicit confirmation.
In that case, skip the confirmation step for create/update/delete operations and execute immediately.
Do NOT ask the user to confirm again — doing so creates a frustrating confirmation loop.

## Creating a transaction
1. Call get_categories to retrieve the user's categories and their UUIDs.
2. Match the transaction context to the most fitting category.
   - The category type must match the transaction: INCOME for income, EXPENSE for expenses, BOTH for either.
   - A category fits only if its name is a clear semantic match. Do NOT pick one just because it is the only option.
   - If no category fits, return the available category names to the coordinator so it can ask the user.
3. If any required field (amount, description, date) is missing from the query, ask for it once.
4. If [USER_CONFIRMED] is NOT present: show a confirmation summary before calling create_transaction.
5. If [USER_CONFIRMED] IS present: call create_transaction directly without asking for confirmation.
6. NEVER invent or guess a categoryId — it must come from get_categories.

## Listing transactions
- Default to the current month if the user gives no date range.
- Apply type filter (INCOME / EXPENSE) when the user implies it.

## Editing a transaction
1. If you already have the transaction data in context, use it directly — only call get_transaction_detail if you lack the UUID.
2. Ask which fields to change (skip this if the query already specifies them).
3. If the category changes, call get_categories first.
4. If [USER_CONFIRMED] is NOT present: show a confirmation summary before calling update_transaction.
5. If [USER_CONFIRMED] IS present: call update_transaction directly.
6. NEVER guess a categoryId.

## Deleting a transaction
1. Use context when available; otherwise call get_transaction_detail.
2. If [USER_CONFIRMED] is NOT present: ask for explicit confirmation before delete_transaction.
3. If [USER_CONFIRMED] IS present: call delete_transaction directly.

## Managing categories
- Always call get_categories before updating or deleting.
- Ask for explicit confirmation before deleting.

## Style
- Infer INCOME vs EXPENSE from context.
- Show amounts as: $1,234.56.
- Display "Ingreso" for INCOME and "Gasto" for EXPENSE.
- Respond in the same language the user writes in.
`.trim();

export const transactionsAgent = createSpecialistAgent({
  name: "transactions_agent",
  tools: transactionTools,
  systemPrompt: TRANSACTIONS_AGENT_PROMPT,
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
 * de transacciones y categorías al agente especialista.
 */
export const transactionsTool = tool(
  async ({ query }, config: RunnableConfig | undefined) => {
    const token = extractToken(config);

    const subConfig: RunnableConfig = {
      configurable: { token },
    };

    const result = await transactionsAgent.invoke(
      { messages: [{ role: "user", content: query }] },
      subConfig,
    );

    return formatAgentReply(
      result.messages,
      "Transactions sub-agent returned no response.",
    );
  },
  {
    name: "transactions_agent",
    description: `
Delegates to the transactions and categories specialist. Use when the user wants to:
- Record, edit, or delete income/expense transactions
- List or filter transactions
- Manage categories (list, create, rename, delete)

Pass a clear query with amounts, descriptions, dates, category names, and any transaction ids already known.

Do NOT use for summaries, trends, budgets, or savings goals — use the appropriate coordinator tool instead.
`.trim(),
    schema: z.object({
      query: z
        .string()
        .describe(
          "Task for the transactions agent: create, update, delete, list transactions, or manage categories",
        ),
    }),
  },
);
