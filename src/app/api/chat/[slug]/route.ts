import { nanoid } from "nanoid";
import { z } from "zod";
import { mutate, type ChatMessage, type Conversation } from "@/lib/db";
import { replyStream } from "@/lib/brain";
import { chatAccess, validVisitor } from "@/lib/chat-access";
import { clientIp, fail, rateLimit } from "@/lib/api";

export const maxDuration = 300;
type Ctx = { params: Promise<{ slug: string }> };

const Body = z.object({
  visitorId: z.string().refine(validVisitor),
  conversationId: z.string().max(40).nullish(),
  message: z.string().trim().max(12_000).optional(),
  regenerate: z.boolean().optional(),
  accessCode: z.string().max(60).nullish(),
  preview: z.boolean().optional(),
});

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid message");
  const { visitorId, conversationId, message, regenerate, accessCode } = parsed.data;
  if (!regenerate && !message) return fail("Write a message first");

  const access = await chatAccess(slug, accessCode);
  if ("error" in access) return fail(access.error, access.status);
  const { bot, owner } = access;
  const preview = owner && !!parsed.data.preview;

  const limitKey = `chat:${bot.id}:${owner ? "owner" : clientIp(req)}`;
  if (!rateLimit(limitKey, owner ? 300 : 40, 10 * 60_000)) {
    return fail("You're sending messages quickly — take a breath and try again in a few minutes.", 429);
  }

  const now = () => new Date().toISOString();
  const convo = await mutate((d) => {
    let c = conversationId ? d.conversations.find((x) => x.id === conversationId && x.botId === bot.id && x.visitorId === visitorId) : undefined;
    if (!c) {
      if (regenerate) return null;
      c = {
        id: nanoid(12),
        botId: bot.id,
        visitorId,
        title: message!.replace(/\s+/g, " ").slice(0, 70),
        preview,
        messages: [],
        createdAt: now(),
        updatedAt: now(),
      } satisfies Conversation;
      d.conversations.push(c);
    }
    if (regenerate) {
      while (c.messages.at(-1)?.role === "assistant") c.messages.pop();
      if (!c.messages.length) return null;
    } else {
      c.messages.push({ role: "user", content: message!, at: now() });
    }
    c.updatedAt = now();
    return structuredClone(c);
  });
  if (!convo) return fail("Nothing to regenerate");

  const stream = await replyStream(bot, convo.messages as ChatMessage[], req.signal, async (text) => {
    await mutate((d) => {
      const c = d.conversations.find((x) => x.id === convo.id);
      if (!c) return;
      c.messages.push({ role: "assistant", content: text, at: now() });
      c.updatedAt = now();
    });
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-conversation-id": convo.id,
    },
  });
}
