"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { Badge, Button, Field, Input, Section } from "./ui";

function useSubmit() {
  const router = useRouter();
  const [state, setState] = useState<{ loading: boolean; error: string; ok: boolean }>({ loading: false, error: "", ok: false });
  async function submit(body: Record<string, string>) {
    setState({ loading: true, error: "", ok: false });
    const res = await fetch("/api/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setState({ loading: false, error: res.ok ? "" : (data.error ?? "Couldn't save"), ok: res.ok });
    if (res.ok) router.refresh();
    return res.ok;
  }
  return { ...state, submit };
}

export function AccountForms({ name, email, role, createdAt }: { name: string; email: string; role: string; createdAt: string }) {
  const profile = useSubmit();
  const pw = useSubmit();
  const [form, setForm] = useState({ name, email, currentPassword: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const emailChanged = form.email.trim().toLowerCase() !== email;

  return (
    <div className="space-y-5">
      <Section
        title="Profile"
        description={`Member since ${new Date(createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
        action={<Badge tone={role === "admin" ? "violet" : "neutral"}>{role === "admin" ? "Administrator" : "Coach"}</Badge>}
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            profile.submit({ name: form.name, email: form.email, ...(emailChanged ? { currentPassword: form.currentPassword } : {}) });
          }}
        >
          <Field label="Name" hint="Changing this doesn't rename existing minds — update each mind's Identity if needed.">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          {emailChanged && (
            <Field label="Current password" hint="Required to change your email.">
              <Input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required autoComplete="current-password" />
            </Field>
          )}
          <Feedback {...profile} okText="Profile saved" />
          <Button type="submit" loading={profile.loading}>
            Save profile
          </Button>
        </form>
      </Section>

      <Section title="Password" description="Changing it signs you out on every other device.">
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pwForm.newPassword !== pwForm.confirm) return;
            if (await pw.submit({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })) {
              setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
            }
          }}
        >
          <Field label="Current password">
            <Input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required autoComplete="current-password" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="New password">
              <Input type="password" minLength={8} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required autoComplete="new-password" />
            </Field>
          </div>
          {pwForm.confirm && pwForm.confirm !== pwForm.newPassword && <p className="text-sm text-rose-600">Passwords don&apos;t match</p>}
          <Feedback {...pw} okText="Password changed" />
          <Button type="submit" loading={pw.loading} disabled={!pwForm.newPassword || pwForm.newPassword !== pwForm.confirm}>
            Change password
          </Button>
        </form>
      </Section>
    </div>
  );
}

function Feedback({ error, ok, okText }: { error: string; ok: boolean; okText: string }) {
  if (error) return <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>;
  if (ok)
    return (
      <p className="flex items-center gap-1.5 text-sm text-emerald-700">
        <Check className="size-4" /> {okText}
      </p>
    );
  return null;
}
