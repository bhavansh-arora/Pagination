"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, Plus, X } from "lucide-react";
import { Button, Field, Input } from "./ui";

const EMOJIS = ["✨", "🌿", "🔥", "🧠", "🌊", "☀️", "🦋", "🚀", "💎", "🧘", "🎯", "💪", "🌱", "🦁", "🕊️", "🌙"];

export function NewMindButton({ variant = "primary", label = "New mind" }: { variant?: "primary" | "card"; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === "card" ? (
        <button
          onClick={() => setOpen(true)}
          className="group flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-violet-200 bg-white/50 text-violet-700 transition hover:border-violet-400 hover:bg-violet-50/50"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-violet-100 transition group-hover:scale-105">
            <Plus className="size-6" />
          </span>
          <span className="font-semibold">{label}</span>
        </button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> {label}
        </Button>
      )}
      {open && <NewMindDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function NewMindDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/bots", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, emoji }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }
    router.push(`/dashboard/bots/${data.bot.id}`);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={create}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-fade-up rounded-3xl border border-line bg-white p-7 shadow-lift"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Create a new mind</h2>
            <p className="mt-1 text-sm text-muted">You can change everything later.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-zinc-100" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-5">
          <Field label="Name" hint='What clients will see, e.g. "Maya AI" or "The Clarity Coach".'>
            <Input ref={ref} value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="Maya AI" />
          </Field>
          <div>
            <div className="mb-2 text-[13px] font-semibold">Avatar</div>
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`grid aspect-square place-items-center rounded-xl text-xl transition ${emoji === e ? "bg-violet-100 ring-2 ring-violet-400" : "hover:bg-zinc-100"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!name.trim()}>
            Create & start training
          </Button>
        </div>
      </form>
    </div>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut className="size-4" /> Sign out
    </Button>
  );
}
