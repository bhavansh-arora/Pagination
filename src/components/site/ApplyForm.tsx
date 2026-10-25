"use client";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, Field, Input, Textarea } from "../ui";

export function ApplyForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (done) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Application received</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Thanks! We review applications quickly. You&apos;ll get a personal sign-up link by email once you&apos;re approved.</p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-violet-700 hover:underline">
          Back to home
        </Link>
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
        const res = await fetch("/api/apply", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
        });
        if (res.ok) setDone(true);
        else setError((await res.json().catch(() => ({}))).error ?? "Something went wrong");
        setLoading(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <Input name="name" required maxLength={80} autoComplete="name" placeholder="Maya Lopez" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" placeholder="you@coaching.com" />
        </Field>
      </div>
      <Field label="What do you coach?">
        <Input name="niche" required maxLength={120} placeholder="Career change for women in tech" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Audience size">
          <select name="audience" className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm focus:border-violet-400 focus:ring-4 focus:ring-violet-100 focus:outline-none">
            <option value="">Choose…</option>
            <option>Just starting</option>
            <option>Under 1,000</option>
            <option>1,000 – 10,000</option>
            <option>10,000 – 100,000</option>
            <option>100,000+</option>
          </select>
        </Field>
        <Field label="Website or social (optional)">
          <Input name="website" maxLength={300} placeholder="instagram.com/yourname" />
        </Field>
      </div>
      <Field label="Anything else? (optional)">
        <Textarea name="message" rows={3} maxLength={2000} placeholder="What would you like your AI mind to help clients with?" />
      </Field>
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <Button type="submit" size="lg" variant="dark" className="w-full rounded-full bg-night text-cream hover:bg-black" loading={loading}>
        Apply for access
      </Button>
      <p className="text-center text-xs text-muted">
        Already approved?{" "}
        <Link href="/login" className="font-medium text-gold-deep hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
