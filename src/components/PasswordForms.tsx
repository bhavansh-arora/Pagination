"use client";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, MailCheck } from "lucide-react";
import { Button, Field, Input } from "./ui";

export function ForgotForm({ kind }: { kind: "coach" | "client" }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (sent) {
    return (
      <div className="text-center">
        <MailCheck className="mx-auto size-10 text-violet-600" />
        <p className="mt-3 text-sm text-muted">If an account exists for that email, a reset link is on its way. It expires in 1 hour.</p>
      </div>
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const email = new FormData(e.currentTarget).get("email");
        const res = await fetch("/api/password/forgot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, kind }) });
        if (res.ok) setSent(true);
        else setError((await res.json().catch(() => ({}))).error ?? "Something went wrong");
        setLoading(false);
      }}
    >
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </Field>
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [done, setDone] = useState<"coach" | "client" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
        <p className="mt-3 text-sm text-muted">Your password has been changed and you&apos;ve been signed out everywhere.</p>
        <Link href={done === "coach" ? "/login" : "/me"} className="mt-5 inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-white">
          Sign in
        </Link>
      </div>
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pw !== confirm) return setError("Passwords don't match");
        setLoading(true);
        setError("");
        const res = await fetch("/api/password/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password: pw }) });
        const data = await res.json().catch(() => ({}));
        if (res.ok) setDone(data.kind);
        else setError(data.error ?? "Something went wrong");
        setLoading(false);
      }}
    >
      <Field label="New password">
        <Input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password">
        <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </Field>
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Set new password
      </Button>
    </form>
  );
}
