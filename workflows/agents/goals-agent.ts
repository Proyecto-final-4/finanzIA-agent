import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import type { RunnableConfig } from "@langchain/core/runnables";
import * as z from "zod";

import { extractToken } from "../tools/_auth";
import { getGoals } from "../tools/get-goals";
import { createGoal } from "../tools/create-goal";
import { updateGoal } from "../tools/update-goal";
import { deleteGoal } from "../tools/delete-goal";
import { createSpecialistAgent } from "./_agent-factory";
import { formatAgentReply } from "./_format-reply";

const model = new ChatOpenAI({
  model: "gpt-5.5-2026-04-23",
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

export const goalsAgent = createSpecialistAgent({
  name: "goals_agent",
  tools: goalTools,
  systemPrompt: GOALS_SYSTEM_PROMPT,
  model,
  contextSchema: z.object({
    token: z
      .string()
      .optional()
      .describe("JWT token for backend authentication"),
  }),
});

/**
 * Delegates savings-goals work to goals_agent.
 * The coordinator invokes this tool when the conversation involves
 * savings goals, progress toward objectives, etc.
 */
export const goalsTool = tool(
  async ({ request }, config: RunnableConfig | undefined) => {
    const token = extractToken(config);

    const subConfig: RunnableConfig = {
      configurable: { token },
    };

    const result = await goalsAgent.invoke(
      { messages: [{ role: "user", content: request }] },
      subConfig,
    );

    // Se pasa result como nullFallback para reproducir el comportamiento
    // original: si content es null/undefined, serializar el resultado completo
    return formatAgentReply(
      result.messages,
      "Goals sub-agent returned no response.",
      result,
    );
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
