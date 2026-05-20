import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import type { RunnableConfig } from "@langchain/core/runnables";
import * as z from "zod";

import { extractToken } from "../tools/_auth";
import { getGoals } from "../tools/get-goals";
import { createGoal } from "../tools/create-goal";
import { updateGoal } from "../tools/update-goal";
import { deleteGoal } from "../tools/delete-goal";

const model = new ChatOpenAI({
  model: "gpt-5.4-mini-2026-03-17",
  temperature: 0,
});

const GOALS_SYSTEM_PROMPT = `
You are the savings goals specialist for finanzIA.
You help users create, track, update, and delete savings goals (metas de ahorro).

Rules:
- Use get_goals before update_goal or delete_goal to obtain valid UUIDs.
- When the user reports progress ("ya ahorré X"), update currentAmount via update_goal.
- When a goal is fully reached, set isCompleted to true.
- Confirm destructive actions (delete) with the user before calling delete_goal.
- Respond in the same language the user writes in (Spanish by default).
- Return concise summaries with amounts and progress percentages when relevant.
`.trim();

const goalTools = [getGoals, createGoal, updateGoal, deleteGoal];

export const goalsAgent = createAgent({
  model,
  tools: goalTools,
  name: "goals_agent",
  systemPrompt: GOALS_SYSTEM_PROMPT,
  contextSchema: z.object({
    token: z
      .string()
      .optional()
      .describe("JWT token for backend authentication"),
  }),
});

/**
 * Delegates savings-goal work to goals_agent. The coordinator invokes this tool
 * when the conversation involves savings goals, progress toward objectives, etc.
 */
export const goalsTool = tool(
  async ({ request }, config) => {
    const token = extractToken(config);

    const subConfig: RunnableConfig = {
      configurable: { token },
    };

    const result = await goalsAgent.invoke(
      { messages: [{ role: "user", content: request }] },
      subConfig,
    );

    const lastMessage = result.messages.at(-1);
    const content = lastMessage?.content;

    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((block) =>
          typeof block === "string"
            ? block
            : "text" in block
              ? String(block.text)
              : JSON.stringify(block),
        )
        .join("\n");
    }

    return JSON.stringify(content ?? result);
  },
  {
    name: "goals_agent",
    description: `
Specialized agent for savings goals (metas de ahorro).

Invoke when the user wants to:
- Create a new savings goal ("quiero ahorrar para...")
- Check progress on existing goals ("¿cómo voy con mi meta del viaje?")
- Update saved amount or mark a goal complete
- List or delete savings goals

Pass a clear, self-contained request describing what the user needs.
Do NOT use for budgets, transactions, or general summaries — use the appropriate agent/tool instead.
`.trim(),
    schema: z.object({
      request: z
        .string()
        .describe(
          "Natural-language instruction for the goals specialist, including relevant amounts, names, and dates",
        ),
    }),
  },
);
