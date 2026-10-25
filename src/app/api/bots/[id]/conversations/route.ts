import { read } from "@/lib/db";
import { json, ownedBot } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const r = await ownedBot((await params).id);
  if (r instanceof Response) return r;
  const conversations = (await read()).conversations
    .filter((c) => c.botId === r.bot.id && !c.preview)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 200);
  return json({ conversations });
}
