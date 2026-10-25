"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Loader2, LogOut } from "lucide-react";
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
