import { Empty, PageHeader, Panel, td, th } from "@/components/admin/parts";
import { read } from "@/lib/db";

export const metadata = { title: "Activity log" };

export default async function ActivityPage() {
  const d = await read();
  const entries = [...d.audit].reverse().slice(0, 300);
  return (
    <>
      <PageHeader title="Activity log" subtitle="Every admin action, newest first." />
      <Panel>
        {entries.length === 0 ? (
          <Empty>No admin actions yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-line bg-zinc-50/60">
                <tr>
                  <th className={th}>When</th>
                  <th className={th}>Admin</th>
                  <th className={th}>Action</th>
                  <th className={th}>Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className={`${td} whitespace-nowrap text-muted`}>
                      {new Date(e.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </td>
                    <td className={td}>{e.actorEmail}</td>
                    <td className={`${td} font-medium`}>{e.action}</td>
                    <td className={`${td} text-muted`}>{e.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
