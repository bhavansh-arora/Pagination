import { read } from "@/lib/db";
import { json, ownedBot } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const r = await ownedBot((await params).id);
  if (r instanceof Response) return r;
  const d = await read();
  const conversations = d.conversations
    .filter((c) => c.botId === r.bot.id && !c.preview)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 200)
    .map(({ ipHash: _ip, ...c }) => ({ ...c, client: c.visitorId.startsWith("cl-") ? (d.clients.find((x) => `cl-${x.id}` === c.visitorId)?.name ?? null) : null }));
  const keys = new Set(conversations.map((c) => c.visitorId));
  const memories = Object.fromEntries(d.memories.filter((m) => m.botId === r.bot.id && keys.has(m.visitorKey) && m.notes).map((m) => [m.visitorKey, m.notes]));
  return json({ conversations, memories });
}
