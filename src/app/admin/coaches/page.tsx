import Link from "next/link";
import { CreateCoachButton, SearchBox } from "@/components/admin/AdminClient";
import { Empty, Initials, PageHeader, Panel, Pill, td, th } from "@/components/admin/parts";
import { read } from "@/lib/db";
import { ago, EMPTY, money, usageBy } from "@/lib/stats";

export const metadata = { title: "Coaches" };

export default async function CoachesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status } = await searchParams;
  const d = await read();
  const usage = usageBy(d, "coachId");
  const needle = q.trim().toLowerCase();
  const coaches = d.coaches
    .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.email.includes(needle))
    .filter((c) => !status || (status === "admin" ? c.role === "admin" : c.status === status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filters = [
    { id: undefined, label: "All", count: d.coaches.length },
    { id: "active", label: "Active", count: d.coaches.filter((c) => c.status === "active").length },
    { id: "suspended", label: "Suspended", count: d.coaches.filter((c) => c.status === "suspended").length },
    { id: "admin", label: "Admins", count: d.coaches.filter((c) => c.role === "admin").length },
  ];

  return (
    <>
      <PageHeader title="Coaches" subtitle="Everyone who can sign in to the studio." action={<CreateCoachButton />} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-zinc-100/80 p-1">
          {filters.map((f) => {
            const active = status === f.id;
            const params = new URLSearchParams(q ? { q } : {});
            if (f.id) params.set("status", f.id);
            return (
              <Link
                key={f.label}
                href={`/admin/coaches${params.size ? `?${params}` : ""}`}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium ${active ? "bg-white shadow-soft" : "text-muted hover:text-ink"}`}
              >
                {f.label} <span className="text-muted tabular-nums">{f.count}</span>
              </Link>
            );
          })}
        </div>
        <SearchBox placeholder="Search name or email…" />
      </div>
      <Panel>
        {coaches.length === 0 ? (
          <Empty>No coaches match.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line bg-zinc-50/60">
                <tr>
                  <th className={th}>Coach</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Minds</th>
                  <th className={`${th} text-right`}>Replies · 30d</th>
                  <th className={`${th} text-right`}>Est. cost · 30d</th>
                  <th className={th}>Last sign-in</th>
                  <th className={th}>Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {coaches.map((c) => {
                  const bots = d.bots.filter((b) => b.coachId === c.id);
                  const u = usage.get(c.id) ?? EMPTY;
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/60">
                      <td className={td}>
                        <Link href={`/admin/coaches/${c.id}`} className="flex items-center gap-3">
                          <Initials name={c.name} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 font-medium">
                              {c.name} {c.role === "admin" && <Pill tone="violet">Admin</Pill>}
                            </span>
                            <span className="block truncate text-xs text-muted">{c.email}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={td}>{c.status === "active" ? <Pill tone="green">Active</Pill> : <Pill tone="red">Suspended</Pill>}</td>
                      <td className={`${td} text-right tabular-nums`}>
                        {bots.length}
                        <span className="text-muted"> · {bots.filter((b) => b.published).length} live</span>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{u.messages.toLocaleString()}</td>
                      <td className={`${td} text-right tabular-nums`}>{money(u.cost)}</td>
                      <td className={`${td} text-muted`}>{ago(c.lastLoginAt)}</td>
                      <td className={`${td} text-muted`}>{new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
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
