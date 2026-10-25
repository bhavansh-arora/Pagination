import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, MessagesSquare, Sparkles } from "lucide-react";
import { BotAvatar, Logo } from "@/components/brand";
import { NewMindButton, SignOutButton } from "@/components/DashboardClient";
import { getCoach } from "@/lib/auth";
import { read } from "@/lib/db";

export const metadata = { title: "Your minds" };

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function Dashboard() {
  const coach = await getCoach();
  if (!coach) redirect("/login");
  const d = await read();
  const bots = d.bots
    .filter((b) => b.coachId === coach.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((b) => {
      const sources = d.sources.filter((s) => s.botId === b.id);
      const convos = d.conversations.filter((c) => c.botId === b.id && !c.preview);
      return {
        bot: b,
        sources: sources.length,
        words: Math.round(sources.reduce((n, s) => n + s.chars, 0) / 5.5),
        conversations: convos.length,
        messages: convos.reduce((n, c) => n + c.messages.filter((m) => m.role === "user").length, 0),
      };
    });
  const totals = bots.reduce((t, b) => ({ c: t.c + b.conversations, m: t.m + b.messages, w: t.w + b.words }), { c: 0, m: 0, w: 0 });

  return (
    <div className="mesh min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{coach.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Hi {coach.name.split(" ")[0]} 👋</h1>
            <p className="mt-1.5 text-muted">Build and manage the AI minds your clients talk to.</p>
          </div>
          {bots.length > 0 && <NewMindButton />}
        </div>

        {bots.length > 0 && (
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Sparkles, label: "Minds", value: bots.length },
              { icon: MessagesSquare, label: "Client conversations", value: totals.c },
              { icon: BookOpen, label: "Words of knowledge", value: totals.w.toLocaleString() },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-line bg-white/80 px-5 py-4 shadow-soft backdrop-blur">
                <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <Icon className="size-5" />
                </span>
                <div>
                  <div className="text-xl font-semibold tabular-nums">{value}</div>
                  <div className="text-xs text-muted">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {bots.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-line bg-white/80 px-6 py-16 text-center shadow-soft backdrop-blur">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-3xl">🧠</div>
            <h2 className="mt-5 text-xl font-semibold">Create your first mind</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Give it your voice and philosophy, feed it your content, then share a link with your clients. They&apos;ll be able to chat with it like a GPT built from you.
            </p>
            <div className="mt-6">
              <NewMindButton label="Create my mind" />
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bots.map(({ bot, sources, words, conversations }) => (
              <Link
                key={bot.id}
                href={`/dashboard/bots/${bot.id}`}
                className="group relative flex min-h-56 flex-col overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div
                  className="absolute inset-x-0 top-0 h-20 opacity-70"
                  style={{ background: `linear-gradient(120deg, color-mix(in srgb, ${bot.brandColor} 18%, white), white)` }}
                />
                <div className="relative flex items-start justify-between">
                  <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={52} className="ring-4 ring-white" />
                  {bot.published ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
                      <span className="size-1.5 rounded-full bg-emerald-500" /> Live
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/70">Draft</span>
                  )}
                </div>
                <h3 className="relative mt-4 text-lg font-semibold tracking-tight">{bot.name}</h3>
                <p className="relative mt-1 line-clamp-2 text-sm text-muted">{bot.tagline || "No tagline yet"}</p>
                <div className="relative mt-auto flex items-center gap-4 pt-5 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="size-3.5" /> {sources} sources · {words.toLocaleString()} words
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MessagesSquare className="size-3.5" /> {conversations}
                  </span>
                  <span className="ml-auto">{ago(bot.updatedAt)}</span>
                </div>
              </Link>
            ))}
            <NewMindButton variant="card" />
          </div>
        )}
      </main>
    </div>
  );
}
