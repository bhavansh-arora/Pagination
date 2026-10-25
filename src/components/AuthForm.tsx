"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input } from "./ui";

export function AuthForm({ mode, invite, inviteEmail }: { mode: "login" | "signup"; invite?: string; inviteEmail?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const body = { ...Object.fromEntries(new FormData(e.currentTarget)), ...(invite ? { invite } : {}) };
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.push((await res.json()).redirect ?? "/dashboard");
      router.refresh();
      return;
    }
    setError((await res.json().catch(() => ({}))).error ?? "Something went wrong");
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "signup" && (
        <Field label="Your name" hint="Your mind will speak as you, so use the name clients know you by.">
          <Input name="name" required autoComplete="name" placeholder="Maya Lopez" />
        </Field>
      )}
      <Field label="Email">
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@coaching.com"
          defaultValue={inviteEmail}
          readOnly={!!inviteEmail}
          className={inviteEmail ? "bg-zinc-50 text-muted" : undefined}
        />
      </Field>
      <Field label="Password">
        <Input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
        />
      </Field>
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <Button type="submit" size="lg" loading={loading} className="w-full">
        {mode === "signup" ? "Create my account" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-violet-700 hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-violet-700 hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mesh grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-[400px] animate-fade-up">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-lift backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 mb-7 text-sm text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
