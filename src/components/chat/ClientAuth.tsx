"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function ClientAuthForm({
  onDone,
  visitorId,
  initialMode = "signup",
  accent = true,
}: {
  onDone: () => void;
  visitorId?: string | null;
  initialMode?: "signup" | "login";
  accent?: boolean;
}) {
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const body = { ...Object.fromEntries(new FormData(e.currentTarget)), visitorId: visitorId ?? undefined };
    const res = await fetch(`/api/client/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) return onDone();
    setError((await res.json().catch(() => ({}))).error ?? "Something went wrong");
    setLoading(false);
  }

  const input =
    "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-black/5";
  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 text-sm font-medium">
        {(["signup", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={cn("rounded-lg py-2 transition", mode === m ? "bg-white shadow-soft" : "text-muted hover:text-ink")}
          >
            {m === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && <input name="name" required maxLength={80} placeholder="Your name" autoComplete="name" className={input} />}
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className={input} />
        <input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className={input}
        />
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button
          disabled={loading}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60",
            accent ? "bg-accent" : "bg-ink",
          )}
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {mode === "signup" ? "Create free account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
