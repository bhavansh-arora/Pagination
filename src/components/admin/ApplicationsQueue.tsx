"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, ExternalLink, Globe, Users, X } from "lucide-react";
import type { Application } from "@/lib/db";
import { cn } from "@/lib/cn";
import { Button } from "../ui";
import { api, CopyBox } from "./AdminClient";

export function ApplicationsQueue({ apps, inviteTokens }: { apps: Application[]; inviteTokens: Record<string, string> }) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>(inviteTokens);
  const [emailed, setEmailed] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"new" | "approved" | "rejected">("new");
  useEffect(() => setOrigin(window.location.origin), []);
  const shown = apps.filter((a) => a.status === tab);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id + action);
    try {
      const res = await api(`/api/admin/applications/${id}`, "PATCH", { action });
      if (res.token) setLinks((l) => ({ ...l, [id]: res.token }));
      if (res.emailed) setEmailed((m) => ({ ...m, [id]: true }));
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-line px-4 pt-3">
        {(["new", "approved", "rejected"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("-mb-px border-b-2 px-3 pb-2.5 text-sm font-medium capitalize", tab === t ? "border-violet-600 text-violet-800" : "border-transparent text-muted hover:text-ink")}
          >
            {t === "new" ? "To review" : t} <span className="text-muted tabular-nums">{apps.filter((a) => a.status === t).length}</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted">{tab === "new" ? "No applications waiting. They arrive from the Apply page on your website." : "Nothing here."}</div>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((a) => (
            <li key={a.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{a.name}</span>
                    <span className="text-sm text-muted">{a.email}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="font-medium text-violet-700">{a.niche}</span>
                    {a.audience && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" /> {a.audience}
                      </span>
                    )}
                    {a.website && (
                      <a
                        href={/^https?:\/\//.test(a.website) ? a.website : `https://${a.website}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1 hover:text-ink"
                      >
                        <Globe className="size-3" /> {a.website.replace(/^https?:\/\//, "")} <ExternalLink className="size-3" />
                      </a>
                    )}
                    <span>{new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </div>
                  {a.message && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-700">{a.message}</p>}
                </div>
                {a.status === "new" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" loading={busy === a.id + "reject"} onClick={() => act(a.id, "reject")}>
                      <X className="size-4" /> Decline
                    </Button>
                    <Button size="sm" loading={busy === a.id + "approve"} onClick={() => act(a.id, "approve")}>
                      <Check className="size-4" /> Approve
                    </Button>
                  </div>
                )}
                {a.status === "rejected" && (
                  <Button size="sm" variant="secondary" loading={busy === a.id + "approve"} onClick={() => act(a.id, "approve")}>
                    Approve instead
                  </Button>
                )}
              </div>
              {a.status === "approved" && links[a.id] && origin && (
                <div className="mt-3 max-w-xl space-y-1.5">
                  <p className="text-xs font-medium text-emerald-700">
                    {emailed[a.id] ? `Approved — we emailed this sign-up link to ${a.email}:` : `Approved — send this personal sign-up link to ${a.email}:`}
                  </p>
                  <CopyBox value={`${origin}/signup?invite=${links[a.id]}`} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
