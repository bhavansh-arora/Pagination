"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MailPlus, Trash2 } from "lucide-react";
import type { Invite } from "@/lib/db";
import { cn } from "@/lib/cn";
import { Button, Field, Input } from "../ui";
import { api, CopyBox } from "./AdminClient";

type Row = Invite & { usedByName?: string };

export function InviteManager({ invites, signupMode }: { invites: Row[]; signupMode: string }) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [form, setForm] = useState({ email: "", note: "", days: 7 });
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const link = (token: string) => `${origin}/signup?invite=${token}`;
  const now = Date.now();

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form
        className="h-fit space-y-4 rounded-2xl border border-line bg-white p-6 shadow-soft"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError("");
          try {
            const { invite } = await api("/api/admin/invites", "POST", form);
            setCreated(link(invite.token));
            setForm({ email: "", note: "", days: 7 });
            router.refresh();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <h2 className="font-semibold">New invite link</h2>
          <p className="mt-1 text-sm text-muted">Single-use link that lets one coach create an account{signupMode === "open" ? "" : ", even while sign-ups are closed"}.</p>
        </div>
        <Field label="Email (optional)" hint="Locks the invite to this address.">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="coach@example.com" />
        </Field>
        <Field label="Note (optional)" hint="Only visible to admins.">
          <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={200} placeholder="Spring cohort" />
        </Field>
        <Field label="Expires after">
          <select
            value={form.days}
            onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
            className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm focus:border-violet-400 focus:ring-4 focus:ring-violet-100 focus:outline-none"
          >
            {[1, 3, 7, 14, 30, 90].map((d) => (
              <option key={d} value={d}>
                {d} day{d > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </Field>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          <MailPlus className="size-4" /> Create invite link
        </Button>
        {created && (
          <div className="space-y-2 rounded-xl bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-800">Invite ready — send this link:</p>
            <CopyBox value={created} />
          </div>
        )}
      </form>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="border-b border-line px-5 py-3.5 text-sm font-semibold">All invites</div>
        {invites.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted">No invites yet.</div>
        ) : (
          <ul className="divide-y divide-line">
            {invites.map((i) => {
              const state = i.usedAt ? "used" : new Date(i.expiresAt).getTime() < now ? "expired" : "pending";
              return (
                <li key={i.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {i.email || "Anyone with the link"}
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            state === "pending" && "bg-violet-50 text-violet-700",
                            state === "used" && "bg-emerald-50 text-emerald-700",
                            state === "expired" && "bg-zinc-100 text-zinc-500",
                          )}
                        >
                          {state === "used" ? `Used${i.usedByName ? ` by ${i.usedByName}` : ""}` : state === "expired" ? "Expired" : "Pending"}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted">
                        {i.note && <>{i.note} · </>}Created {new Date(i.createdAt).toLocaleDateString()} · {state === "pending" ? "expires" : "expired"}{" "}
                        {new Date(i.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this invite?")) return;
                        await api(`/api/admin/invites/${i.id}`, "DELETE");
                        router.refresh();
                      }}
                      className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete invite"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {state === "pending" && origin && (
                    <div className="mt-2.5">
                      <CopyBox value={link(i.token)} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
