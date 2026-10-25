"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, KeyRound, MoreHorizontal, Search, ShieldCheck, ShieldOff, Trash2, UserPlus, UserX, UserCheck, X, EyeOff, Eye } from "lucide-react";
import { Button, Field, Input, Segmented } from "../ui";

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}

export function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md animate-fade-up rounded-3xl border border-line bg-white p-7 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-zinc-100" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CopyBox({ value, mono = true }: { value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-zinc-50 p-1.5 pl-3">
      <code className={`min-w-0 flex-1 truncate text-[13px] text-zinc-800 ${mono ? "" : "font-sans"}`}>{value}</code>
      <Button
        variant="secondary"
        size="sm"
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function CredentialsNotice({ email, password, onDone }: { email: string; password: string; onDone: () => void }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Share these sign-in details securely. The password won&apos;t be shown again — they can change it under Account.</p>
      <Field label="Sign-in page">
        <CopyBox value={`${origin}/login`} />
      </Field>
      <Field label="Email">
        <CopyBox value={email} />
      </Field>
      <Field label="Temporary password">
        <CopyBox value={password} />
      </Field>
      <Button className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}

export function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <Input
        value={q}
        placeholder={placeholder}
        className="pl-9"
        onChange={(e) => {
          setQ(e.target.value);
          if (t.current) clearTimeout(t.current);
          const v = e.target.value;
          t.current = setTimeout(() => {
            const next = new URLSearchParams(params);
            if (v) next.set("q", v);
            else next.delete("q");
            router.replace(`?${next.toString()}`);
          }, 250);
        }}
      />
    </div>
  );
}

export function CreateCoachButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "coach" as "coach" | "admin" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const close = () => {
    setOpen(false);
    setCreated(null);
    setForm({ name: "", email: "", password: "", role: "coach" });
    setError("");
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Add coach
      </Button>
      {open && (
        <Modal title={created ? "Account created" : "Add an account"} subtitle={created ? undefined : "Create a login directly. To let people sign up themselves, send an invite instead."} onClose={close}>
          {created ? (
            <CredentialsNotice {...created} onDone={close} />
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError("");
                try {
                  const data = await api("/api/admin/coaches", "POST", form);
                  setCreated({ email: form.email.trim().toLowerCase(), password: data.password });
                  router.refresh();
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Field label="Name">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} placeholder="Maya Lopez" />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="maya@coaching.com" />
              </Field>
              <Field label="Password" hint="Leave empty to generate a strong one.">
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} placeholder="Auto-generate" autoComplete="new-password" />
              </Field>
              <div>
                <div className="mb-1.5 text-[13px] font-semibold">Role</div>
                <Segmented
                  value={form.role}
                  options={[
                    { id: "coach", label: "Coach", blurb: "Builds their own minds" },
                    { id: "admin", label: "Admin", blurb: "Full platform access" },
                  ]}
                  onChange={(role) => setForm({ ...form, role })}
                />
              </div>
              {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
              <Button type="submit" className="w-full" loading={loading}>
                Create account
              </Button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}

export function CoachActions({ id, email, role, status, isSelf }: { id: string; email: string; role: string; status: string; isSelf: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [temp, setTemp] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState("");

  async function act(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError("");
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "active" ? (
          <Button variant="secondary" size="sm" disabled={isSelf} loading={busy === "status"} onClick={() => act("status", () => api(`/api/admin/coaches/${id}`, "PATCH", { status: "suspended" }))}>
            <UserX className="size-4" /> Suspend
          </Button>
        ) : (
          <Button variant="secondary" size="sm" loading={busy === "status"} onClick={() => act("status", () => api(`/api/admin/coaches/${id}`, "PATCH", { status: "active" }))}>
            <UserCheck className="size-4" /> Reactivate
          </Button>
        )}
        {role === "admin" ? (
          <Button variant="secondary" size="sm" disabled={isSelf} loading={busy === "role"} onClick={() => act("role", () => api(`/api/admin/coaches/${id}`, "PATCH", { role: "coach" }))}>
            <ShieldOff className="size-4" /> Remove admin
          </Button>
        ) : (
          <Button variant="secondary" size="sm" loading={busy === "role"} onClick={() => act("role", () => api(`/api/admin/coaches/${id}`, "PATCH", { role: "admin" }))}>
            <ShieldCheck className="size-4" /> Make admin
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          loading={busy === "pw"}
          onClick={() =>
            act("pw", async () => {
              if (!confirm(`Reset the password for ${email}? They'll be signed out everywhere.`)) return;
              setTemp((await api(`/api/admin/coaches/${id}/password`, "POST")).password);
            })
          }
        >
          <KeyRound className="size-4" /> Reset password
        </Button>
        <Button variant="danger" size="sm" disabled={isSelf} onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>
      {isSelf && <p className="mt-2 text-xs text-muted">This is your account — some actions are disabled.</p>}
      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {temp && (
        <Modal title="Password reset" onClose={() => setTemp(null)}>
          <CredentialsNotice email={email} password={temp} onDone={() => setTemp(null)} />
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="Delete this account?" subtitle="This permanently deletes the account, all of its minds, knowledge and conversations. It can't be undone." onClose={() => setConfirmDelete(false)}>
          <div className="space-y-4">
            <Field label={`Type ${email} to confirm`}>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} />
            </Field>
            <Button
              variant="danger"
              className="w-full"
              disabled={typed.trim().toLowerCase() !== email}
              loading={busy === "delete"}
              onClick={() =>
                act("delete", async () => {
                  await api(`/api/admin/coaches/${id}`, "DELETE");
                  router.push("/admin/coaches");
                })
              }
            >
              Delete account permanently
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function EditCoachProfile({ id, name, email }: { id: string; name: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name, email });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-violet-700 hover:underline">
        Edit
      </button>
      {open && (
        <Modal title="Edit profile" onClose={() => setOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError("");
              try {
                await api(`/api/admin/coaches/${id}`, "PATCH", form);
                setOpen(false);
                router.refresh();
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setLoading(false);
              }
            }}
          >
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Save
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

export function MindActions({ id, slug, name, published }: { id: string; slug: string; name: string; published: boolean }) {
  const router = useRouter();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const open = !!pos;
  const setOpen = (v: boolean) => !v && setPos(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setPos(null);
    const dismiss = () => setPos(null);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setOpen(false);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-zinc-100";
  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={(e) => {
          if (open) return setPos(null);
          const r = e.currentTarget.getBoundingClientRect();
          const below = window.innerHeight - r.bottom > 200;
          setPos({ top: below ? r.bottom + 4 : r.top - 4 - 176, left: Math.max(8, r.right - 192) });
        }}
        disabled={busy} className="rounded-lg p-1.5 text-muted hover:bg-zinc-100 hover:text-ink disabled:opacity-50" aria-label="Actions">
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="fixed z-50 w-48 rounded-xl border border-line bg-white p-1 shadow-lift" style={pos!}>
          <Link href={`/dashboard/bots/${id}`} className={item}>
            <ShieldCheck className="size-4 text-muted" /> Open in studio
          </Link>
          <a href={`/c/${slug}`} target="_blank" rel="noopener" className={item}>
            <ExternalLink className="size-4 text-muted" /> View chat
          </a>
          <button className={item} onClick={() => run(() => api(`/api/bots/${id}`, "PATCH", { published: !published }))}>
            {published ? <EyeOff className="size-4 text-muted" /> : <Eye className="size-4 text-muted" />} {published ? "Unpublish" : "Publish"}
          </button>
          <button
            className={`${item} text-rose-600 hover:bg-rose-50`}
            onClick={() => {
              if (confirm(`Delete "${name}" with all its knowledge and conversations? This can't be undone.`)) run(() => api(`/api/bots/${id}`, "DELETE"));
            }}
          >
            <Trash2 className="size-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export { api };
