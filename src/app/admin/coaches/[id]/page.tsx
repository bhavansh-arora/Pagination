import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BotAvatar } from "@/components/brand";
import { CoachActions, EditCoachProfile, MindActions } from "@/components/admin/AdminClient";
import { Empty, Initials, Panel, Pill, StatTile, td, th } from "@/components/admin/parts";
import { getCoach } from "@/lib/auth";
import { read } from "@/lib/db";
import { ago, EMPTY, money, usageBy, words } from "@/lib/stats";
import { quotaFor } from "@/lib/quota";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: (await read()).coaches.find((c) => c.id === id)?.name ?? "Coach" };
}

export default async function CoachDetail({ params }: Props) {
  const { id } = await params;
  const me = await getCoach();
  const d = await read();
  const coach = d.coaches.find((c) => c.id === id);
  if (!coach) notFound();
  const bots = d.bots.filter((b) => b.coachId === id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const byBot = usageBy(d, "botId");
  const total = usageBy(d, "coachId").get(id) ?? EMPTY;
  const quota = quotaFor(d, coach);
  const convos = d.conversations.filter((c) => !c.preview && bots.some((b) => b.id === c.botId));
  const sessions = d.sessions.filter((s) => s.coachId === id && new Date(s.expiresAt).getTime() > Date.now()).length;

  return (
    <>
      <Link href="/admin/coaches" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Coaches
      </Link>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start gap-5">
          <Initials name={coach.name} className="size-14 text-base" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{coach.name}</h1>
              {coach.role === "admin" && <Pill tone="violet">Admin</Pill>}
              {coach.status === "active" ? <Pill tone="green">Active</Pill> : <Pill tone="red">Suspended</Pill>}
              <EditCoachProfile id={coach.id} name={coach.name} email={coach.email} />
            </div>
            <div className="mt-1 text-sm text-muted">{coach.email}</div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              <span>Joined {new Date(coach.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
              <span>Last sign-in {ago(coach.lastLoginAt)}</span>
              <span>
                {sessions} active session{sessions === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-line pt-5">
          <CoachActions id={coach.id} email={coach.email} role={coach.role} status={coach.status} isSelf={me?.id === coach.id} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatTile label="Minds" value={bots.length} sub={`${bots.filter((b) => b.published).length} live`} />
        <StatTile label="Conversations" value={convos.length} sub={`${new Set(convos.map((c) => c.visitorId)).size} unique visitors`} />
        <StatTile
          label="AI replies · this month"
          value={quota.used.toLocaleString()}
          sub={quota.limit ? `of ${quota.limit.toLocaleString()} on ${quota.plan.name}${quota.exceeded ? " · limit reached" : ""}` : `unlimited · ${total.messages.toLocaleString()} in 30 days`}
        />
        <StatTile label="Est. cost · 30d" value={money(total.cost)} />
      </div>

      <Panel title="Minds" className="mt-6">
        {bots.length === 0 ? (
          <Empty>This coach hasn&apos;t created a mind yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-line bg-zinc-50/60">
                <tr>
                  <th className={th}>Mind</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Knowledge</th>
                  <th className={`${th} text-right`}>Conversations</th>
                  <th className={`${th} text-right`}>Replies · 30d</th>
                  <th className={`${th} text-right`}>Cost · 30d</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {bots.map((b) => {
                  const u = byBot.get(b.id) ?? EMPTY;
                  const src = d.sources.filter((s) => s.botId === b.id);
                  return (
                    <tr key={b.id} className="hover:bg-zinc-50/60">
                      <td className={td}>
                        <Link href={`/dashboard/bots/${b.id}`} className="flex items-center gap-3">
                          <BotAvatar emoji={b.avatarEmoji} image={b.avatarImage} color={b.brandColor} size={32} />
                          <span>
                            <span className="block font-medium">{b.name}</span>
                            <span className="block text-xs text-muted">/c/{b.slug}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={td}>
                        <span className="flex gap-1.5">
                          {b.published ? <Pill tone="green">Live</Pill> : <Pill tone="amber">Draft</Pill>}
                          {b.visibility === "code" && <Pill tone="zinc">Code</Pill>}
                        </span>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>
                        {src.length} <span className="text-muted">· {words(src.reduce((n, s) => n + s.chars, 0)).toLocaleString()} words</span>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{d.conversations.filter((c) => c.botId === b.id && !c.preview).length}</td>
                      <td className={`${td} text-right tabular-nums`}>{u.messages.toLocaleString()}</td>
                      <td className={`${td} text-right tabular-nums`}>{money(u.cost)}</td>
                      <td className={`${td} text-right`}>
                        <MindActions id={b.id} slug={b.slug} name={b.name} published={b.published} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
