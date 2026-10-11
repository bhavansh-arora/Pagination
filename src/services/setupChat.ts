import Anthropic from "@anthropic-ai/sdk";
import { client } from "./anthropic";
import { config } from "../config";
import { updateAgent } from "../db/agents";
import type { AgentConfig } from "./agentConfig";

const SETUP_SYSTEM_PROMPT = `You are a friendly setup assistant helping someone configure their AI phone agent. Run this like a short, natural conversation - not a form to fill out or a checklist to read back.

Find out, a little at a time:
1. What the agent should say when it picks up (the opening line).
2. How the agent should describe itself or the business if a caller asks who they're talking to.
3. What information the agent should try to collect from each caller during the call - each item needs a short machine-friendly name (like "customer_name") and a plain description (like "the caller's full name").

As soon as you have a clear answer for any one of these, call update_agent_config with just that piece - don't wait until you have everything. If the person already has data fields saved and wants to add another, send the complete list (old fields plus the new one) in dataFields, since it replaces whatever was saved before rather than appending.

Keep your own replies short and conversational - a sentence or two, like a helpful assistant chatting in a text box, not a wall of text. Briefly confirm what you just saved, then naturally ask the next thing. Once you have all three, say so and ask if they'd like to test the agent or change anything.`;

const UPDATE_CONFIG_TOOL: Anthropic.Tool = {
  name: "update_agent_config",
  description:
    "Save one or more pieces of the agent's configuration. Only include fields you actually have new information for - omit the rest.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Internal name for this agent (not spoken to callers)." },
      introLine: { type: "string", description: "The exact opening line the agent should speak first on every call." },
      introDescription: {
        type: "string",
        description: "How the agent should describe itself/the business if a caller asks.",
      },
      dataFields: {
        type: "array",
        description:
          "The full, complete list of data fields to collect - replaces whatever was saved before, so include previously-saved fields too if adding a new one.",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Machine-friendly key, e.g. customer_name" },
            description: { type: "string", description: "Plain description of what to collect" },
          },
          required: ["name", "description"],
        },
      },
    },
  },
};

export interface SetupChatResult {
  reply: string;
  agent: AgentConfig;
}

/**
 * One turn of the setup chatbot: the business owner describes what they
 * want conversationally, Claude extracts structured config via tool-calling
 * (rather than regex/manual parsing) and it's saved immediately per field,
 * then Claude's natural-language confirmation is returned alongside it.
 */
export async function runSetupChat(agent: AgentConfig, userMessage: string): Promise<SetupChatResult> {
  const history: Anthropic.MessageParam[] = [
    ...agent.setupChatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  let currentAgent = agent;
  let finalText = "";

  // Up to a few rounds: handles both "text + tool call in one response" and
  // "tool call only, then a follow-up response with the actual reply."
  for (let round = 0; round < 3; round++) {
    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 1024,
      system: SETUP_SYSTEM_PROMPT,
      tools: [UPDATE_CONFIG_TOOL],
      messages: history,
    });

    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    const toolBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    finalText = textBlocks.map((b) => b.text).join("\n").trim();

    if (toolBlocks.length === 0) break;

    history.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = toolBlocks.map((toolUse) => {
      if (toolUse.name === "update_agent_config") {
        currentAgent = updateAgent(currentAgent.id, toolUse.input as Partial<AgentConfig>) ?? currentAgent;
      }
      return { type: "tool_result", tool_use_id: toolUse.id, content: "ok" };
    });
    history.push({ role: "user", content: toolResults });

    if (finalText) break; // already got a reply alongside the tool call(s)
  }

  currentAgent =
    updateAgent(currentAgent.id, {
      setupChatHistory: [
        ...agent.setupChatHistory,
        { role: "user", content: userMessage },
        { role: "assistant", content: finalText },
      ],
    }) ?? currentAgent;

  return { reply: finalText, agent: currentAgent };
}
