import Link from "next/link";
import { ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import { BotAvatar, Logo } from "@/components/brand";
import { BillingPortalButton, ClientSignIn, ClientSignOut, ForgetButton, PrivacyControls } from "@/components/ClientPortal";
import { clientVisitorKey, getClient } from "@/lib/client-auth";
import { read } from "@/lib/db";
import { isActiveMembership } from "@/lib/entitlements";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "My account" };

const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—");

export default async function ClientHome() {
  const client = await getClient();

  if (!client) {
    return (
      <div className="mesh grid min-h-dvh place-items-center px-4 py-10">
        <div className="w-full max-w-[400px] animate-fade-up rounded-3xl border border-white/70 bg-white/85 p-8 shadow-lift backdrop-blur">
          <Logo />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Your account</h1>
          <p className="mt-1.5 mb-6 text-sm text-muted">Sign in to see your memberships, messages and conversations.</p>
          <ClientSignIn />
        </div>
      </div>
    );
  }

  const d = await read();
  const key = clientVisitorKey(client.id);
  const botsById = new Map(d.bots.map((b) => [b.id, b]));
  const memberships = d.memberships.filter((m) => m.clientId === client.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const credits = d.credits.filter((c) => c.clientId === client.id && c.remaining > 0);
  const convos = d.conversations.filter((c) => c.visitorId === key && !c.preview).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const chattedIds = [...new Set([...convos.map((c) => c.botId), ...memberships.map((m) => m.botId), ...credits.map((c) => c.botId)])];
  const payments = d.payments.filter((p) => p.clientId === client.id).sort((a, b) => b.at.localeCompare(a.at));
  const memories = d.memories.filter((m) => m.visitorKey === key && m.notes);

  return (
    <div className="mesh min-h-dvh">
      <header className="border-b border-line/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Logo href="/me" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{client.email}</span>
            <ClientSignOut />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Hi {client.name.split(" ")[0]} 👋</h1>
          <p className="mt-1.5 text-muted">Your coaches, memberships and conversations in one place.</p>
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">Your coaches</h2>
          {chattedIds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center text-sm text-muted">
              You haven&apos;t talked to anyone yet. Open a link your coach shared to get started.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {chattedIds.map((id) => {
                const bot = botsById.get(id);
                if (!bot) return null;
                const m = memberships.find((x) => x.botId === id && isActiveMembership(x));
                const cr = credits.find((x) => x.botId === id);
                const count = convos.filter((c) => c.botId === id).length;
                return (
                  <Link
                    key={id}
                    href={`/c/${bot.slug}`}
                    className="group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div className="flex items-center gap-3">
                      <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{bot.name}</div>
                        <div className="truncate text-xs text-muted">by {bot.coachName}</div>
                      </div>
                      <ArrowRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      {m ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-700">
                          <Sparkles className="size-3" /> Member
                        </span>
                      ) : bot.pricing.mode === "free" ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">Free</span>
                      ) : null}
                      {cr && <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">{cr.remaining} messages left</span>}
                      <span className="inline-flex items-center gap-1 text-muted">
                        <MessageSquare className="size-3" /> {count} conversation{count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Memberships</h2>
            {client.stripeCustomerId && <BillingPortalButton />}
          </div>
          {memberships.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white/70 px-6 py-6 text-sm text-muted">No memberships yet.</div>
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
              {memberships.map((m) => {
                const bot = botsById.get(m.botId);
                const active = isActiveMembership(m);
                return (
                  <div key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    {bot && <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={36} />}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{bot?.name ?? "Removed mind"}</div>
                      <div className="text-xs text-muted">
                        {formatMoney(m.amount, m.currency)} / {m.interval} ·{" "}
                        {active ? (m.cancelAtPeriodEnd ? `ends ${date(m.currentPeriodEnd)}` : `renews ${date(m.currentPeriodEnd)}`) : `ended`}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? (m.status === "past_due" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700") : "bg-zinc-100 text-zinc-500"}`}
                    >
                      {m.status === "past_due" ? "Payment due" : active ? "Active" : "Canceled"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {payments.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">Payment history</h2>
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
              {payments.slice(0, 20).map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{botsById.get(p.botId ?? "")?.name ?? "Purchase"}</div>
                    <div className="text-xs text-muted">
                      {p.description} · {date(p.at)}
                    </div>
                  </div>
                  <div className="font-semibold tabular-nums">{formatMoney(p.amount, p.currency)}</div>
                </div>
              ))}
            </div>
          </section>
        )}
        {memories.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">What your coaches&apos; AI remembers</h2>
            <div className="space-y-3">
              {memories.map((m) => (
                <div key={m.botId} className="rounded-2xl border border-line bg-white p-5 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{botsById.get(m.botId)?.name ?? "Mind"}</div>
                    <ForgetButton botId={m.botId} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-zinc-700">{m.notes}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <PrivacyControls />
          <p className="mt-3 text-center text-xs text-muted">
            <a href="/legal/privacy" className="hover:text-ink">Privacy</a> · <a href="/legal/terms" className="hover:text-ink">Terms</a> ·{" "}
            <a href="/legal/refunds" className="hover:text-ink">Refunds</a>
          </p>
        </section>
      </main>
    </div>
  );
}
