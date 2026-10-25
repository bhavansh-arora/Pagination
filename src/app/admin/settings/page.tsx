import fs from "node:fs/promises";
import path from "node:path";
import { CheckCircle2, XCircle } from "lucide-react";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PageHeader, Panel } from "@/components/admin/parts";
import { DATA_DIR, read } from "@/lib/db";

export const metadata = { title: "Settings" };

async function dirSize(dir: string): Promise<number> {
  let total = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? await dirSize(p) : (await fs.stat(p).catch(() => ({ size: 0 }))).size;
  }
  return total;
}

const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;

export default async function SettingsPage() {
  const d = await read();
  const size = await dirSize(DATA_DIR);
  const apiKey = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  const rows: [string, React.ReactNode][] = [
    [
      "Anthropic API key",
      apiKey ? (
        <span className="flex items-center gap-1.5 text-emerald-700">
          <CheckCircle2 className="size-4" /> Configured
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-rose-600">
          <XCircle className="size-4" /> Missing — set ANTHROPIC_API_KEY
        </span>
      ),
    ],
    ["Data directory", <code key="dir" className="text-xs">{DATA_DIR}</code>],
    ["Data size", `${mb(size)} · ${d.sources.length} knowledge files · ${d.conversations.length} conversations`],
    ["Node.js", process.version],
    ["Server uptime", `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`],
  ];

  return (
    <>
      <PageHeader title="Settings" subtitle="Platform-wide rules and server status." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <SettingsForm initial={d.settings} />
        <div className="space-y-6">
          <Panel title="Server">
            <dl className="divide-y divide-line text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="px-5 py-3">
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="mt-0.5 break-all">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel title="Backups">
            <div className="space-y-2 px-5 py-4 text-sm text-muted">
              <p>Everything lives in the data directory. Back it up daily with:</p>
              <code className="block rounded-lg bg-zinc-900 px-3 py-2 text-xs text-zinc-100">./deploy/backup.sh</code>
              <p>See the README&apos;s deployment section for a cron example.</p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
