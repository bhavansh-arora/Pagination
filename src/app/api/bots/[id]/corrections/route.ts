import { nanoid } from "nanoid";
import { z } from "zod";
import { mutate, read, readSourceText, writeSourceText } from "@/lib/db";
import { normalize } from "@/lib/ingest";
import { fail, json, ownedBot } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };
const ORIGIN = "Coach corrections";

const Body = z.object({ conversationId: z.string().max(40), index: z.number().int().min(0), answer: z.string().trim().min(1).max(20_000) });

/**
 * The coach rewrites a reply. The fix is stored on the message and appended to a
 * "Coach corrections" knowledge source, so the mind answers that way from now on.
 */
export async function POST(req: Request, { params }: Ctx) {
  const r = await ownedBot((await params).id);
  if (r instanceof Response) return r;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid correction");
  const { conversationId, index, answer } = parsed.data;

  const d = await read();
  const convo = d.conversations.find((c) => c.id === conversationId && c.botId === r.bot.id);
  const msg = convo?.messages[index];
  if (!convo || msg?.role !== "assistant") return fail("Reply not found", 404);
  const question = [...convo.messages.slice(0, index)].reverse().find((m) => m.role === "user")?.content ?? "";
  const entry = `## Q: ${question.replace(/\s+/g, " ").slice(0, 500)}\n\nHow I'd answer: ${answer}`;

  let source = d.sources.find((s) => s.botId === r.bot.id && s.origin === ORIGIN);
  const text = normalize([source ? await readSourceText(source.id) : "", entry].filter(Boolean).join("\n\n"));
  const id = source?.id ?? nanoid();
  await writeSourceText(id, text);
  await mutate((data) => {
    const c = data.conversations.find((x) => x.id === conversationId);
    if (c?.messages[index]) c.messages[index].correction = answer;
    source = data.sources.find((s) => s.id === id);
    if (source) source.chars = text.length;
    else
      data.sources.push({ id, botId: r.bot.id, kind: "text", title: "Corrections from my conversations", origin: ORIGIN, chars: text.length, createdAt: new Date().toISOString() });
  });
  return json({ ok: true });
}
