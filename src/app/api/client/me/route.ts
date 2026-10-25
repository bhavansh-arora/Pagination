import { z } from "zod";
import { verifyPassword } from "@/lib/auth";
import { clientVisitorKey, endClientSession, getClient } from "@/lib/client-auth";
import { isActiveMembership } from "@/lib/entitlements";
import { billingEnabled, stripe } from "@/lib/stripe";
import { mutate, read } from "@/lib/db";
import { fail, json } from "@/lib/api";

export async function GET() {
  const client = await getClient();
  return json({ client: client ? { name: client.name, email: client.email } : null });
}

const Patch = z.object({ name: z.string().trim().min(1).max(80) });

export async function PATCH(req: Request) {
  const client = await getClient();
  if (!client) return fail("Please sign in", 401);
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Enter your name");
  await mutate((d) => {
    const c = d.clients.find((x) => x.id === client.id);
    if (c) c.name = parsed.data.name;
  });
  return json({ ok: true });
}

const Del = z.object({ password: z.string() });

/** Deletes the client's account: cancels active memberships, removes conversations, memory and credits. */
export async function DELETE(req: Request) {
  const client = await getClient();
  if (!client) return fail("Please sign in", 401);
  const parsed = Del.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !(await verifyPassword(parsed.data.password, client.passwordHash))) return fail("Your password is incorrect", 401);

  const active = (await read()).memberships.filter((m) => m.clientId === client.id && isActiveMembership(m));
  if (active.length && billingEnabled()) {
    try {
      await Promise.all(active.map((m) => stripe().subscriptions.cancel(m.stripeSubscriptionId)));
    } catch (err) {
      console.error("[client delete] cancel failed", err);
      return fail("We couldn't cancel your membership automatically. Please cancel it from billing first, then try again.", 502);
    }
  }
  const key = clientVisitorKey(client.id);
  await mutate((d) => {
    d.conversations = d.conversations.filter((c) => c.visitorId !== key);
    d.memories = d.memories.filter((m) => m.visitorKey !== key);
    d.credits = d.credits.filter((c) => c.clientId !== client.id);
    d.clientSessions = d.clientSessions.filter((s) => s.clientId !== client.id);
    d.resetTokens = d.resetTokens.filter((t) => t.userId !== client.id);
    for (const m of d.memberships) if (m.clientId === client.id) Object.assign(m, { clientId: "deleted", status: isActiveMembership(m) ? "canceled" : m.status });
    // Payment records stay for accounting, detached from the person.
    for (const p of d.payments) if (p.clientId === client.id) p.clientId = "deleted";
    d.clients = d.clients.filter((c) => c.id !== client.id);
  });
  await endClientSession();
  return json({ ok: true });
}
