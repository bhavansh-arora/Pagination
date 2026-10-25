import { mutate, read } from "@/lib/db";
import { chatAccess, resolveVisitor, validVisitor } from "@/lib/chat-access";
import { fail, json } from "@/lib/api";

type Ctx = { params: Promise<{ slug: string }> };

async function gate(req: Request, ctx: Ctx) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("visitorId");
  const access = await chatAccess((await ctx.params).slug, req.headers.get("x-access-code"));
  if ("error" in access) return fail(access.error, access.status);
  const preview = access.owner && url.searchParams.get("preview") === "1";
  const visitor = preview ? (validVisitor(raw) ? { key: raw } : null) : await resolveVisitor(raw);
  if (!visitor) return fail("Invalid visitor");
  return { ...access, visitorId: visitor.key, id: url.searchParams.get("id"), preview };
}

export async function GET(req: Request, ctx: Ctx) {
  const g = await gate(req, ctx);
  if (g instanceof Response) return g;
  const mine = (await read()).conversations.filter(
    (c) => c.botId === g.bot.id && c.visitorId === g.visitorId && c.preview === (g.owner && g.preview),
  );
  if (g.id) {
    const c = mine.find((x) => x.id === g.id);
    return c ? json({ conversation: { id: c.id, title: c.title, messages: c.messages } }) : fail("Not found", 404);
  }
  return json({
    conversations: mine
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt })),
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await gate(req, ctx);
  if (g instanceof Response) return g;
  if (!g.id) return fail("Missing id");
  await mutate((d) => {
    d.conversations = d.conversations.filter((c) => !(c.id === g.id && c.botId === g.bot.id && c.visitorId === g.visitorId));
  });
  return json({ ok: true });
}
