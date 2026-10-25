import { clientVisitorKey, getClient } from "@/lib/client-auth";
import { read } from "@/lib/db";
import { fail } from "@/lib/api";

/** Everything stored about the signed-in client, as a JSON download. */
export async function GET() {
  const client = await getClient();
  if (!client) return fail("Please sign in", 401);
  const d = await read();
  const key = clientVisitorKey(client.id);
  const botName = (id: string) => d.bots.find((b) => b.id === id)?.name ?? "(removed)";
  const data = {
    exportedAt: new Date().toISOString(),
    account: { name: client.name, email: client.email, createdAt: client.createdAt },
    conversations: d.conversations
      .filter((c) => c.visitorId === key)
      .map((c) => ({ mind: botName(c.botId), title: c.title, createdAt: c.createdAt, messages: c.messages.map(({ role, content, at, rating }) => ({ role, content, at, rating })) })),
    memories: d.memories.filter((m) => m.visitorKey === key).map((m) => ({ mind: botName(m.botId), notes: m.notes, updatedAt: m.updatedAt })),
    memberships: d.memberships
      .filter((m) => m.clientId === client.id)
      .map((m) => ({ mind: botName(m.botId), status: m.status, interval: m.interval, amount: m.amount, currency: m.currency, since: m.createdAt })),
    messageCredits: d.credits.filter((c) => c.clientId === client.id).map((c) => ({ mind: botName(c.botId), remaining: c.remaining })),
    payments: d.payments
      .filter((p) => p.clientId === client.id)
      .map((p) => ({ date: p.at, description: p.description, amount: p.amount, currency: p.currency, refunded: p.refunded ?? 0 })),
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": 'attachment; filename="my-data.json"', "cache-control": "no-store" },
  });
}
