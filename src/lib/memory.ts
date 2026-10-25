import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { mutate, read, type Bot } from "./db";
import { recordUsage } from "./usage";

const MEMORY_MODEL = "claude-haiku-5-5";
const MAX_NOTES = 1500;

const g = globalThis as unknown as { __memClient?: Anthropic; __memBusy?: Set<string> };
const client = () => (g.__memClient ??= new Anthropic());
const busy = () => (g.__memBusy ??= new Set());

export async function memoryFor(botId: string, visitorKey: string) {
  return (await read()).memories.find((m) => m.botId === botId && m.visitorKey === visitorKey) ?? null;
}

/**
 * Folds recent messages into the client's memory notes. Runs in the background after a
 * reply, at most once per few client messages, on the small model.
 */
export async function maybeUpdateMemory(bot: Bot, visitorKey: string, preview: boolean) {
  if (!bot.memoryEnabled) return;
  const lock = `${bot.id}:${visitorKey}`;
  if (busy().has(lock)) return;
  const d = await read();
  const convos = d.conversations.filter((c) => c.botId === bot.id && c.visitorId === visitorKey).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  const totalUser = convos.reduce((n, c) => n + c.messages.filter((m) => m.role === "user").length, 0);
  const existing = d.memories.find((m) => m.botId === bot.id && m.visitorKey === visitorKey);
  const covered = existing?.coveredMessages ?? 0;
  const fresh = totalUser - covered;
  if (fresh < (covered === 0 ? 2 : 3)) return;

  busy().add(lock);
  try {
    const recent = convos.flatMap((c) => c.messages).slice(-Math.min(40, fresh * 2 + 4));
    const transcript = recent.map((m) => `${m.role === "user" ? "Client" : "Coach AI"}: ${m.content.slice(0, 2000)}`).join("\n\n");
    const res = await client().messages.create({
      model: MEMORY_MODEL,
      max_tokens: 4000,
      output_config: { effort: "low" },
      system:
        "You maintain short private notes a coach keeps about one client, so the next conversation can pick up where the last left off. " +
        "Keep: the client's name if given, goals, current situation, challenges, decisions and commitments they made, progress, and how they like to be coached. " +
        "Drop small talk and anything already outdated. Never record passwords, payment details or government IDs. " +
        `Reply with only the updated notes as a terse bullet list, under ${MAX_NOTES} characters.`,
      messages: [
        {
          role: "user",
          content: `Current notes:\n${existing?.notes || "(none yet)"}\n\nNew conversation excerpts:\n\n${transcript}\n\nWrite the updated notes.`,
        },
      ],
    });
    recordUsage(bot.id, bot.coachId, res.model || MEMORY_MODEL, res.usage, preview).catch(() => undefined);
    if (res.stop_reason === "refusal") return;
    const notes = res.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim()
      .slice(0, MAX_NOTES);
    if (!notes) return;
    await mutate((data) => {
      const m = data.memories.find((x) => x.botId === bot.id && x.visitorKey === visitorKey);
      const now = new Date().toISOString();
      if (m) Object.assign(m, { notes, coveredMessages: totalUser, updatedAt: now });
      else data.memories.push({ botId: bot.id, visitorKey, notes, coveredMessages: totalUser, updatedAt: now });
    });
  } catch (err) {
    console.error("[memory]", err);
  } finally {
    busy().delete(lock);
  }
}
