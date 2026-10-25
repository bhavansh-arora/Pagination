import Link from "next/link";
import { BotAvatar } from "@/components/brand";
import { MindActions, SearchBox } from "@/components/admin/AdminClient";
import { Empty, PageHeader, Panel, Pill, td, th } from "@/components/admin/parts";
import { read } from "@/lib/db";
import { MODELS } from "@/lib/models";
import { ago, EMPTY, money, usageBy, words } from "@/lib/stats";

export const metadata = { title: "Minds" };

export default async function MindsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const d = await read();
  const usage = usageBy(d, "botId");
  const needle = q.trim().toLowerCase();
  const rows = d.bots
    .map((b) => ({ b, owner: d.coaches.find((c) => c.id === b.coachId) }))
    .filter(({ b, owner }) => !needle || `${b.name} ${b.slug} ${owner?.name} ${owner?.email}`.toLowerCase().includes(needle))
    .sort((a, b) => b.b.updatedAt.localeCompare(a.b.updatedAt));

  return (
    <>
      <PageHeader title="Minds" subtitle={`${d.bots.length} mind${d.bots.length === 1 ? "" : "s"} across ${d.coaches.length} account${d.coaches.length === 1 ? "" : "s"}.`} action={<SearchBox placeholder="Search minds or owners…" />} />
      <Panel>
        {rows.length === 0 ? (
          <Empty>No minds match.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-line bg-zinc-50/60">
                <tr>
                  <th className={th}>Mind</th>
                  <th className={th}>Owner</th>
                  <th className={th}>Status</th>
                  <th className={th}>Model</th>
                  <th className={`${th} text-right`}>Knowledge</th>
                  <th className={`${th} text-right`}>Convos</th>
                  <th className={`${th} text-right`}>Replies · 30d</th>
                  <th className={`${th} text-right`}>Cost · 30d</th>
                  <th className={th}>Updated</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ b, owner }) => {
                  const u = usage.get(b.id) ?? EMPTY;
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
                        {owner ? (
                          <Link href={`/admin/coaches/${owner.id}`} className="hover:underline">
                            {owner.name}
                            {owner.status === "suspended" && <span className="ml-1.5 text-xs text-rose-600">(suspended)</span>}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={td}>
                        <span className="flex gap-1.5">
                          {b.published ? <Pill tone="green">Live</Pill> : <Pill tone="amber">Draft</Pill>}
                          {b.visibility === "code" && <Pill tone="zinc">Code</Pill>}
                        </span>
                      </td>
                      <td className={`${td} text-xs text-muted`}>{MODELS.find((m) => m.id === b.model)?.label.replace("Claude ", "") ?? b.model}</td>
                      <td className={`${td} text-right tabular-nums`}>{words(d.sources.filter((s) => s.botId === b.id).reduce((n, s) => n + s.chars, 0)).toLocaleString()} w</td>
                      <td className={`${td} text-right tabular-nums`}>{d.conversations.filter((c) => c.botId === b.id && !c.preview).length}</td>
                      <td className={`${td} text-right tabular-nums`}>{u.messages.toLocaleString()}</td>
                      <td className={`${td} text-right tabular-nums`}>{money(u.cost)}</td>
                      <td className={`${td} text-muted`}>{ago(b.updatedAt)}</td>
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
