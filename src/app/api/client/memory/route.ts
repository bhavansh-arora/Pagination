import { clientVisitorKey, getClient } from "@/lib/client-auth";
import { mutate } from "@/lib/db";
import { fail, json } from "@/lib/api";

/** Lets a client erase what a mind remembers about them. */
export async function DELETE(req: Request) {
  const client = await getClient();
  if (!client) return fail("Please sign in", 401);
  const botId = new URL(req.url).searchParams.get("botId");
  const key = clientVisitorKey(client.id);
  await mutate((d) => {
    const total = (id: string) => d.conversations.filter((c) => c.botId === id && c.visitorId === key).reduce((n, c) => n + c.messages.filter((m) => m.role === "user").length, 0);
    for (const m of d.memories) {
      if (m.visitorKey !== key || (botId && m.botId !== botId)) continue;
      // Keep a marker so past messages aren't immediately re-summarised.
      Object.assign(m, { notes: "", coveredMessages: total(m.botId), updatedAt: new Date().toISOString() });
    }
  });
  return json({ ok: true });
}
