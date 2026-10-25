import { z } from "zod";
import { mutate } from "@/lib/db";
import { chatAccess, resolveVisitor, validVisitor } from "@/lib/chat-access";
import { fail, json } from "@/lib/api";

type Ctx = { params: Promise<{ slug: string }> };

const Body = z.object({
  visitorId: z.string().max(64),
  conversationId: z.string().max(40),
  content: z.string().min(1).max(40_000),
  rating: z.enum(["up", "down"]).nullable(),
  accessCode: z.string().max(60).nullish(),
  preview: z.boolean().optional(),
});

/** Thumbs up/down on an assistant reply. The reply is matched by its text. */
export async function POST(req: Request, { params }: Ctx) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid feedback");
  const access = await chatAccess((await params).slug, parsed.data.accessCode);
  if ("error" in access) return fail(access.error, access.status);
  const preview = access.owner && !!parsed.data.preview;
  const visitor = preview ? (validVisitor(parsed.data.visitorId) ? { key: parsed.data.visitorId } : null) : await resolveVisitor(parsed.data.visitorId);
  if (!visitor) return fail("Invalid visitor");
  const ok = await mutate((d) => {
    const c = d.conversations.find((x) => x.id === parsed.data.conversationId && x.botId === access.bot.id && x.visitorId === visitor.key);
    const m = c?.messages.findLast((x) => x.role === "assistant" && x.content === parsed.data.content);
    if (!m) return false;
    if (parsed.data.rating) m.rating = parsed.data.rating;
    else delete m.rating;
    return true;
  });
  return ok ? json({ ok: true }) : fail("Message not found", 404);
}
