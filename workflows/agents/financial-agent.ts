import {
  createAgent,
  createMiddleware,
  dynamicSystemPromptMiddleware,
  summarizationMiddleware,
} from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";

import { buildSystemPrompt } from "./system-prompt";
import { createTransaction } from "../tools/create-transaction";
import { getTransactions } from "../tools/get-transactions";
import { getTransactionDetail } from "../tools/get-transaction-detail";
import { getCategories } from "../tools/get-categories";
import { createCategory } from "../tools/create-category";
import { updateCategory } from "../tools/update-category";
import { deleteCategory } from "../tools/delete-category";

const model = new ChatOpenAI({
  model: "gpt-5.4-mini-2026-03-17",
  temperature: 0,
});

const tools = [
  createTransaction,
  getTransactions,
  getTransactionDetail,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
];

/**
 * Reads token from graph state and injects it into runtime.configurable
 * so tools can access it via config.configurable.token.
 *
 * State is the input form rendered by LangSmith Studio, which allows
 * passing the JWT when testing without a running BFF.
 */
const tokenMiddleware = createMiddleware({
  name: "TokenMiddleware",
  wrapToolCall: async (request, handler) => {
    return handler(request);
  },
});

export const agent = createAgent({
  model,
  tools,
  name: "financial_agent",
  stateSchema: z.object({
    token: z
      .string()
      .optional()
      .describe("JWT token for backend authentication"),
  }),
  contextSchema: z.object({
    userName: z
      .string()
      .optional()
      .describe("Display name of the authenticated user"),
    token: z
      .string()
      .optional()
      .describe("JWT token for backend authentication"),
  }),
  middleware: [
    tokenMiddleware,
    dynamicSystemPromptMiddleware((_state, runtime) => {
      const ctx = runtime.context as { userName?: string } | undefined;
      return buildSystemPrompt({ userName: ctx?.userName });
    }),
    summarizationMiddleware({
      model: "openai:gpt-4.1-mini",
      trigger: { tokens: 4000 },
      keep: { messages: 20 },
    }),
  ],
});
