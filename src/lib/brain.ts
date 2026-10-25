import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { read, readSourceText, type Bot, type ChatMessage } from "./db";
import { buildPersona, knowledgeBlock } from "./prompt";
import { chunkText, rank, type Chunk } from "./retrieval";
import { MODELS } from "./models";
import { recordUsage } from "./usage";

/** Below this size the whole library rides along in the cached system prompt. */
export const FULL_MEMORY_CHARS = 600_000;
const HISTORY_LIMIT = 60;

const EFFORT = { fast: "low", balanced: "medium", deep: "high" } as const;

const g = globalThis as unknown as { __client?: Anthropic; __chunks?: Map<string, Chunk[]> };
const client = () => (g.__client ??= new Anthropic());
const chunkCache = () => (g.__chunks ??= new Map());

async function loadKnowledge(botId: string) {
  const d = await read();
  const sources = d.sources.filter((s) => s.botId === botId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const total = sources.reduce((n, s) => n + s.chars, 0);
  return { sources, total };
}

export type StreamEvent = { t: "text"; v: string } | { t: "done" } | { t: "error"; message: string };

export async function replyStream(
  bot: Bot,
  history: ChatMessage[],
  signal: AbortSignal,
  onFinish: (text: string) => Promise<void>,
): Promise<ReadableStream<Uint8Array>> {
  const { sources, total } = await loadKnowledge(bot.id);
  const persona = buildPersona(bot);
  const fullMemory = total <= FULL_MEMORY_CHARS;
  const turns = history.slice(-HISTORY_LIMIT);
  if (turns[0]?.role === "assistant") turns.shift();

  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((m) => ({ role: m.role, content: m.content }));
  const system: Anthropic.Beta.BetaTextBlockParam[] = [{ type: "text", text: persona }];

  if (fullMemory) {
    const docs = await Promise.all(sources.map(async (s) => ({ title: s.title, text: await readSourceText(s.id) })));
    const block = knowledgeBlock(docs.filter((d) => d.text));
    if (block) system.push({ type: "text", text: block });
  } else {
    system.push({
      type: "text",
      text: "Your library is large, so the most relevant passages from it are attached to the client's latest message inside <relevant_knowledge>. Treat them as your knowledge section.",
    });
    const cache = chunkCache();
    const all: Chunk[] = [];
    for (const s of sources) {
      let chunks = cache.get(s.id);
      if (!chunks) {
        chunks = chunkText(s.title, await readSourceText(s.id));
        cache.set(s.id, chunks);
      }
      all.push(...chunks);
    }
    const recentUser = turns.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join("\n");
    const hits = rank(all, recentUser, 14);
    const last = messages[messages.length - 1];
    if (hits.length && last?.role === "user" && typeof last.content === "string") {
      const excerpts = hits.map((h) => `<excerpt from="${h.sourceTitle.replace(/"/g, "'")}">\n${h.text}\n</excerpt>`).join("\n\n");
      last.content = [
        { type: "text", text: `<relevant_knowledge>\nExcerpts from your own material that may help with this message:\n\n${excerpts}\n</relevant_knowledge>` },
        { type: "text", text: last.content },
      ];
    }
  }
  system[system.length - 1].cache_control = { type: "ephemeral" };

  const model = MODELS.some((m) => m.id === bot.model) ? bot.model : MODELS[0].id;
  const supportsFallback = model !== "claude-haiku-5-5";
  const encoder = new TextEncoder();
  const send = (c: ReadableStreamDefaultController<Uint8Array>, e: StreamEvent) =>
    c.enqueue(encoder.encode(JSON.stringify(e) + "\n"));

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let text = "";
      try {
        const stream = client().beta.messages.stream(
          {
            model,
            max_tokens: 16000,
            system,
            messages,
            cache_control: { type: "ephemeral" },
            output_config: { effort: EFFORT[bot.depth] },
            ...(supportsFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
          },
          { signal },
        );
        for await (const ev of stream) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            text += ev.delta.text;
            send(controller, { t: "text", v: ev.delta.text });
          }
        }
        const final = await stream.finalMessage();
        recordUsage(bot.id, bot.coachId, model, final.usage).catch((e) => console.error("[usage]", e));
        if (final.stop_reason === "refusal") {
          text = "I'm not able to help with that one. Is there something else on your mind I can help you work through?";
          send(controller, { t: "error", message: text });
        } else {
          send(controller, { t: "done" });
        }
      } catch (err) {
        if (signal.aborted) {
          // Client pressed stop: keep what was generated so far.
        } else {
          send(controller, { t: "error", message: friendlyError(err) });
          console.error("[chat]", err);
        }
      } finally {
        if (text.trim()) await onFinish(text).catch((e) => console.error("[chat:save]", e));
        try {
          controller.close();
        } catch {}
      }
    },
  });
}

function friendlyError(err: unknown) {
  if (err instanceof Anthropic.AuthenticationError) return "This mind isn't connected to its AI yet (missing or invalid API key).";
  if (err instanceof Anthropic.RateLimitError) return "Lots of conversations right now — please try again in a moment.";
  if (err instanceof Anthropic.BadRequestError) return "Something about that message couldn't be processed. Try rephrasing it.";
  if (err instanceof Anthropic.APIError) return "The AI service hit a temporary problem. Please try again.";
  if (err instanceof Error && /api key|apiKey|ANTHROPIC/i.test(err.message)) return "This mind isn't connected to its AI yet (missing API key).";
  return "Something went wrong. Please try again.";
}
