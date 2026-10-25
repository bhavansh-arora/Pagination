import { deleteSourceText, mutate, read, readSourceText } from "@/lib/db";
import { fail, json, ownedBot } from "@/lib/api";

type Ctx = { params: Promise<{ id: string; sourceId: string }> };

async function find(ctx: Ctx) {
  const { id, sourceId } = await ctx.params;
  const r = await ownedBot(id);
  if (r instanceof Response) return r;
  const source = (await read()).sources.find((s) => s.id === sourceId && s.botId === r.bot.id);
  return source ?? fail("Not found", 404);
}

export async function GET(_: Request, ctx: Ctx) {
  const source = await find(ctx);
  if (source instanceof Response) return source;
  const text = await readSourceText(source.id);
  return json({ source, preview: text.slice(0, 4000) });
}

export async function DELETE(_: Request, ctx: Ctx) {
  const source = await find(ctx);
  if (source instanceof Response) return source;
  await mutate((d) => {
    d.sources = d.sources.filter((s) => s.id !== source.id);
  });
  await deleteSourceText(source.id);
  return json({ ok: true });
}
