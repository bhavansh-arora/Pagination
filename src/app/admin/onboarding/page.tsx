import Link from "next/link";
import { Check } from "lucide-react";
import { ApplicationsQueue } from "@/components/admin/ApplicationsQueue";
import { Empty, Initials, PageHeader, Panel, Pill, td, th } from "@/components/admin/parts";
import { read } from "@/lib/db";
import { ago } from "@/lib/stats";

export const metadata = { title: "Coach onboarding" };

const STEPS = ["Mind", "Knowledge", "Published", "Payouts", "Pricing", "First sale"] as const;

export default async function OnboardingPage() {
  const d = await read();
  const coaches = d.coaches.filter((c) => c.role === "coach").sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const progress = coaches.map((c) => {
    const bots = d.bots.filter((b) => b.coachId === c.id);
    const ids = new Set(bots.map((b) => b.id));
    const done = [
      bots.length > 0,
      d.sources.some((s) => ids.has(s.botId)),
      bots.some((b) => b.published),
      !!c.payoutsReady,
      bots.some((b) => b.pricing.mode === "paid"),
      d.payments.some((p) => p.coachId === c.id && p.kind !== "coach_plan"),
    ];
    return { coach: c, done };
  });

  const funnel = [
    { label: "Applied", value: d.applications.length },
    { label: "Approved", value: d.applications.filter((a) => a.status === "approved").length },
    { label: "Signed up", value: coaches.length },
    ...STEPS.map((label, i) => ({ label, value: progress.filter((p) => p.done[i]).length })),
  ];
  const max = Math.max(1, ...funnel.map((f) => f.value));
  const tokens = Object.fromEntries(
    d.applications
      .filter((a) => a.status === "approved" && a.inviteId)
      .map((a) => [a.id, d.invites.find((i) => i.id === a.inviteId && !i.usedAt)?.token])
      .filter(([, t]) => t) as [string, string][],
  );

  return (
    <>
      <PageHeader title="Coach onboarding" subtitle="Review applications and help new coaches get from sign-up to their first sale." />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Applications">
          <ApplicationsQueue apps={[...d.applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt))} inviteTokens={tokens} />
        </Panel>

        <Panel title="Onboarding funnel">
          <ul className="space-y-2.5 px-5 py-4">
            {funnel.map((f, i) => (
              <li key={f.label} className="grid grid-cols-[96px_1fr_40px] items-center gap-3 text-sm">
                <span className={i < 3 ? "font-medium" : "text-muted"}>{f.label}</span>
                <span className="h-6 overflow-hidden rounded-[4px] bg-zinc-100">
                  <span className="block h-full rounded-[4px] bg-violet-500" style={{ width: `${(f.value / max) * 100}%`, minWidth: f.value ? 4 : 0 }} />
                </span>
                <span className="text-right font-semibold tabular-nums">{f.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Coach progress" className="mt-6">
        {progress.length === 0 ? (
          <Empty>No coaches yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-line bg-zinc-50/60">
                <tr>
                  <th className={th}>Coach</th>
                  {STEPS.map((s) => (
                    <th key={s} className={`${th} text-center`}>
                      {s}
                    </th>
                  ))}
                  <th className={th}>Next step</th>
                  <th className={th}>Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {progress.map(({ coach, done }) => {
                  const next = done.indexOf(false);
                  return (
                    <tr key={coach.id} className="hover:bg-zinc-50/60">
                      <td className={td}>
                        <Link href={`/admin/coaches/${coach.id}`} className="flex items-center gap-3">
                          <Initials name={coach.name} className="size-8" />
                          <span>
                            <span className="block font-medium">{coach.name}</span>
                            <span className="block text-xs text-muted">joined {ago(coach.createdAt)}</span>
                          </span>
                        </Link>
                      </td>
                      {done.map((ok, i) => (
                        <td key={i} className={`${td} text-center`}>
                          {ok ? (
                            <span className="inline-grid size-6 place-items-center rounded-full bg-emerald-500 text-white">
                              <Check className="size-3.5" strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="inline-block size-6 rounded-full border-2 border-dashed border-zinc-200" />
                          )}
                        </td>
                      ))}
                      <td className={td}>{next === -1 ? <Pill tone="green">Fully launched</Pill> : <Pill tone="amber">{STEPS[next]}</Pill>}</td>
                      <td className={`${td} text-muted`}>{ago(coach.lastLoginAt)}</td>
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
