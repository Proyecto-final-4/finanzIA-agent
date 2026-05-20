import { createAgent } from "langchain";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { StructuredTool } from "@langchain/core/tools";
import * as z from "zod";

/**
 * Configuration for creating a specialist (sub-)agent.
 * All specialist agents share the same base structure.
 */
interface SpecialistAgentConfig {
  /** Unique agent name (snake_case), used in traces and logs */
  name: string;
  /** Tools the agent can invoke */
  tools: StructuredTool[];
  /** System prompt defining the agent role and rules */
  systemPrompt: string;
  /** Language model instance */
  model: BaseChatModel;
  /**
   * Zod schema for context the agent can read.
   * Typically includes the JWT for authentication.
   * If omitted, the agent does not declare a context schema.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contextSchema?: z.ZodObject<any>;
}

/**
 * Factory that creates a specialist sub-agent using LangChain's createAgent.
 *
 * Centralizes repeated boilerplate in transactions-agent, budgets-agent
 * and goals-agent: model, tools, name, systemPrompt and contextSchema.
 *
 * NOTE: Uses createAgent from `langchain` (not createReactAgent from
 * @langchain/langgraph/prebuilt) to stay compatible with contextSchema
 * and the coordinator API (financial-agent.ts).
 */
export function createSpecialistAgent(config: SpecialistAgentConfig) {
  return createAgent({
    model: config.model,
    tools: config.tools,
    name: config.name,
    systemPrompt: config.systemPrompt,
    ...(config.contextSchema ? { contextSchema: config.contextSchema } : {}),
  });
}
