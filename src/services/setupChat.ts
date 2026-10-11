import OpenAI from "openai";
import { client } from "./llm";
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

const UPDATE_CONFIG_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: "function",
  function: {
    name: "update_agent_config",
    description:
      "Save one or more pieces of the agent's configuration. Only include fields you actually have new information for - omit the rest.",
    parameters: {
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
  },
};

export interface SetupChatResult {
  reply: string;
  agent: AgentConfig;
}

/**
 * One turn of the setup chatbot: the business owner describes what they
 * want conversationally, GPT extracts structured config via tool-calling
 * (rather than regex/manual parsing) and it's saved immediately per field,
 * then GPT's natural-language confirmation is returned alongside it.
 */
export async function runSetupChat(agent: AgentConfig, userMessage: string): Promise<SetupChatResult> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SETUP_SYSTEM_PROMPT },
    ...agent.setupChatHistory.map((m): OpenAI.Chat.ChatCompletionMessageParam => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  let currentAgent = agent;
  let finalText = "";

  // Up to a few rounds: handles both "text + tool call in one response" and
  // "tool call only, then a follow-up response with the actual reply."
  for (let round = 0; round < 3; round++) {
    const response = await client.chat.completions.create({
      model: config.openai.model,
      max_completion_tokens: 1024,
      tools: [UPDATE_CONFIG_TOOL],
      messages,
    });

    const message = response.choices[0].message;
    finalText = (message.content ?? "").trim();
    const toolCalls = message.tool_calls ?? [];

    if (toolCalls.length === 0) break;

    messages.push(message);

    for (const toolCall of toolCalls) {
      if (toolCall.type === "function" && toolCall.function.name === "update_agent_config") {
        try {
          const input = JSON.parse(toolCall.function.arguments) as Partial<AgentConfig>;
          currentAgent = updateAgent(currentAgent.id, input) ?? currentAgent;
        } catch {
          // Malformed tool input - skip it rather than crash the whole turn.
        }
      }
      messages.push({ role: "tool", tool_call_id: toolCall.id, content: "ok" });
    }

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
