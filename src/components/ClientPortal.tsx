"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Download, Loader2, LogOut, Trash2 } from "lucide-react";
import { ClientAuthForm } from "./chat/ClientAuth";

export function ClientSignIn() {
  const router = useRouter();
  return <ClientAuthForm initialMode="login" accent={false} onDone={() => router.refresh()} />;
}

export function ClientSignOut() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/client/logout", { method: "POST" });
        router.refresh();
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink"
    >
      <LogOut className="size-4" /> Sign out
    </button>
  );
}

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        onClick={async () => {
          setLoading(true);
          setError("");
          const res = await fetch("/api/client/portal", { method: "POST" });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.url) window.location.href = data.url;
          else {
            setError(data.error ?? "Couldn't open billing");
            setLoading(false);
          }
        }}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-medium shadow-soft hover:bg-zinc-50"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />} Manage billing & invoices
      </button>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

export function PrivacyControls() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium">Your data</div>
          <div className="text-xs text-muted">Download everything we store about you, or delete your account.</div>
        </div>
        <a href="/api/client/export" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium hover:bg-zinc-50">
          <Download className="size-4" /> Download my data
        </a>
        <button onClick={() => setConfirming((v) => !v)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-sm font-medium text-rose-600 hover:bg-rose-50">
          <Trash2 className="size-4" /> Delete account
        </button>
      </div>
      {confirming && (
        <form
          className="mt-4 space-y-3 border-t border-line pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            const res = await fetch("/api/client/me", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
            if (res.ok) {
              router.push("/");
              return;
            }
            setError((await res.json().catch(() => ({}))).error ?? "Couldn't delete your account");
            setLoading(false);
          }}
        >
          <p className="text-sm text-zinc-700">This cancels any memberships, and permanently deletes your conversations, memory notes and unused messages. It can&apos;t be undone.</p>
          <input
            type="password"
            required
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
            {loading && <Loader2 className="size-4 animate-spin" />} Permanently delete my account
          </button>
        </form>
      )}
    </div>
  );
}

export function ForgetButton({ botId }: { botId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (!confirm("Erase what this mind remembers about you?")) return;
        setBusy(true);
        await fetch(`/api/client/memory?botId=${encodeURIComponent(botId)}`, { method: "DELETE" });
        router.refresh();
      }}
      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
    >
      Forget this
    </button>
  );
}
