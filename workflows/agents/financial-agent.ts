import {
  createAgent,
  createMiddleware,
  dynamicSystemPromptMiddleware,
  summarizationMiddleware,
} from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";

import { buildSystemPrompt } from "./system-prompt";
import { getSummary } from "../tools/get-summary";
import { getTrends } from "../tools/get-trends";
import { ragSearch } from "../tools/rag-search";
import { transactionsTool } from "./transactions-agent";
import { budgetsTool } from "./budgets-agent";
import { goalsTool } from "./goals-agent";

const model = new ChatOpenAI({
  model: "gpt-5.5-2026-04-23",
});

const tools = [
  getSummary,
  getTrends,
  ragSearch,
  transactionsTool,
  budgetsTool,
  goalsTool,
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
