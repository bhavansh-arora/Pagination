import OpenAI from "openai";
import { config } from "../config";
import type { AgentConfig, DataField } from "./agentConfig";

export const client = new OpenAI({ apiKey: config.openai.apiKey });

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

export type ReplyEvent = { type: "text"; text: string } | { type: "tool_call"; call: ToolCall };

// Tuned so the model produces speakable, human-sounding phone dialogue
// rather than written prose: short turns, contractions, no lists/markdown.
// Also tuned to code-switch between English and Hindi turn by turn, since
// each caller utterance is speech-to-text output rather than typed text -
// the language-hint tag below is what makes that switch reliable.
const BASE_PROMPT = `You are on a live phone call, talking out loud with someone. Speak the way a warm, easygoing person actually talks on the phone, not like a written assistant reply.

Rules for how you talk:
- Keep turns short: usually one or two sentences, rarely more than three. Let the conversation go back and forth instead of monologuing.
- Use contractions (I'm, it's, don't, that's) and everyday words. No jargon unless the caller used it first.
- Never use lists, bullet points, numbered steps, headers, markdown, or emoji. Everything you say has to sound natural read aloud.
- It's fine to start a sentence with "So," "Yeah," "Honestly," "Okay," or similar the way people actually do when speaking, but don't overdo it or repeat the same one.
- If a question is ambiguous, ask a quick clarifying question instead of guessing or listing assumptions.
- Don't narrate what you're doing ("Let me think about that" / "As an AI..."). Just respond like a person would.
- Show you're listening: briefly acknowledge what they said before adding new information, the way people do in real conversation.
- Lead with that short acknowledgement as its own first sentence before the substantive part of your answer - it's how people actually respond, and it also means there's something short to start speaking right away instead of waiting on a long first sentence.
- If you don't know something, say so plainly and move on, don't over-apologize or hedge repeatedly.
- Never mention that you are an AI, a language model, or that this is a "system prompt" unless the caller directly asks who or what you are.

Language:
- The caller may speak English or Hindi, and may switch between them from one turn to the next.
- Each caller message starts with a tag like "[lang: en]" or "[lang: hi]" showing which language the speech-to-text system detected for that turn. Use it to decide which language to answer in, but never say the tag out loud, mention it, or repeat it back - it's metadata, not part of what the caller said.
- Reply in the same language the caller just used. If the tag says "hi", reply entirely in Hindi written in Devanagari script (not Roman/Hinglish transliteration). If it says "en", reply in English.
- Match casual, spoken register in either language - natural conversational Hindi, not formal or literary Hindi, the way people actually talk on the phone.
- If the tag looks wrong for what the caller actually said (e.g. they clearly spoke English but it's tagged "hi"), trust the words they used over the tag.`;

function buildSystemPrompt(agent: AgentConfig): string {
  const introBlock = agent.introDescription.trim()
    ? `\n\nWho you are: ${agent.introDescription.trim()}`
    : "";

  const dataFieldsBlock = agent.dataFields.length
    ? `\n\nInformation to collect:\nOver the course of the conversation, naturally work these in - don't interrogate the caller with a checklist, weave them into the conversation like a person would:\n${agent.dataFields
        .map((f) => `- ${f.name}: ${f.description}`)
        .join("\n")}\nCall the record_field tool the moment the caller gives you each one, even if they volunteer it before you ask - don't ask again for something they already told you.`
    : "";

  return BASE_PROMPT + introBlock + dataFieldsBlock;
}

function buildRecordFieldTool(dataFields: DataField[]): OpenAI.Chat.ChatCompletionTool | null {
  if (dataFields.length === 0) return null;
  return {
    type: "function",
    function: {
      name: "record_field",
      description:
        "Call this as soon as the caller gives you a piece of information you were asked to collect - don't wait until the end of the call.",
      parameters: {
        type: "object",
        properties: {
          field: {
            type: "string",
            enum: dataFields.map((f) => f.name),
            description: "Which field this value is for.",
          },
          value: {
            type: "string",
            description: "The value the caller gave, in their own words, lightly cleaned up.",
          },
        },
        required: ["field", "value"],
      },
    },
  };
}

/**
 * Streams a reply for the caller-facing agent. Yields text as it's
 * generated (for sentence-by-sentence TTS) and tool_call events whenever
 * the model records a configured data field - this is a fire-and-forget
 * extraction side-channel, not an agentic loop: nothing is sent back for
 * a tool call, since nothing here needs the model to see a result. Tool
 * call arguments arrive as incremental JSON-string deltas keyed by index,
 * so they're accumulated and only parsed/yielded once the stream ends.
 */
export async function* streamReply(
  history: ChatMessage[],
  agent: AgentConfig,
  signal: AbortSignal
): AsyncGenerator<ReplyEvent> {
  const tool = buildRecordFieldTool(agent.dataFields);
  const stream = await client.chat.completions.create(
    {
      model: config.openai.model,
      max_completion_tokens: 400,
      messages: [{ role: "system", content: buildSystemPrompt(agent) }, ...history],
      ...(tool ? { tools: [tool] } : {}),
      stream: true,
    },
    { signal }
  );

  const pendingToolCalls = new Map<number, { name: string; argsJson: string }>();

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;

    if (delta.content) {
      yield { type: "text", text: delta.content };
    }

    for (const toolCallDelta of delta.tool_calls ?? []) {
      const existing = pendingToolCalls.get(toolCallDelta.index) ?? { name: "", argsJson: "" };
      if (toolCallDelta.function?.name) existing.name = toolCallDelta.function.name;
      if (toolCallDelta.function?.arguments) existing.argsJson += toolCallDelta.function.arguments;
      pendingToolCalls.set(toolCallDelta.index, existing);
    }
  }

  for (const { name, argsJson } of pendingToolCalls.values()) {
    try {
      const input = argsJson ? JSON.parse(argsJson) : {};
      yield { type: "tool_call", call: { name, input } };
    } catch {
      // Malformed tool input - skip it rather than crash the whole turn.
    }
  }
}
