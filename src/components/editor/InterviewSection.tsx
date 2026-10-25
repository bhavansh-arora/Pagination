"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import type { Bot, Source, Tone } from "@/lib/db";
import { cn } from "@/lib/cn";
import { INTERVIEW_QUESTIONS, type InterviewAnswers } from "@/lib/interview";
import { TONES } from "@/lib/models";
import { Button, Textarea } from "../ui";
import type { Update } from "./Editor";

interface Draft {
  tagline: string;
  bio: string;
  philosophy: string;
  instructions: string;
  boundaries: string;
  welcomeMessage: string;
  starters: string[];
  tones: Tone[];
  responseLength: Bot["responseLength"];
  ctaLabel: string;
  ctaUrl: string;
  knowledgeNote: string;
}

const FIELDS: { key: keyof Draft; label: string }[] = [
  { key: "tagline", label: "Tagline" },
  { key: "bio", label: "About you" },
  { key: "philosophy", label: "Coaching philosophy" },
  { key: "instructions", label: "Coaching instructions" },
  { key: "boundaries", label: "Boundaries" },
  { key: "welcomeMessage", label: "Welcome message" },
  { key: "starters", label: "Conversation starters" },
  { key: "tones", label: "Tone & reply length" },
  { key: "ctaUrl", label: "Call to action" },
  { key: "knowledgeNote", label: "Knowledge note: your method & common questions" },
];

const store = (key: string, v?: string) => {
  try {
    if (v === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, v);
  } catch {}
  return null;
};

export function InterviewSection({ bot, update, onSource, onDone }: { bot: Bot; update: Update; onSource: (s: Source) => void; onDone: () => void }) {
  const key = `mc:interview:${bot.id}`;
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pick, setPick] = useState<Record<string, boolean>>({});
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const saved = store(key);
    if (saved) setAnswers(JSON.parse(saved));
  }, [key]);
  useEffect(() => {
    if (Object.keys(answers).length) store(key, JSON.stringify(answers));
  }, [answers, key]);

  const q = INTERVIEW_QUESTIONS[step];
  const answered = INTERVIEW_QUESTIONS.filter((x) => (answers[x.id] ?? "").trim()).length;

  async function generate() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/bots/${bot.id}/interview`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers }) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong");
    setDraft(data.draft);
    const d = data.draft as Draft;
    setPick(Object.fromEntries(FIELDS.map((f) => [f.key, Array.isArray(d[f.key]) ? (d[f.key] as unknown[]).length > 0 : !!d[f.key]])));
  }

  async function apply() {
    if (!draft) return;
    setApplying(true);
    const patch: Partial<Bot> = {};
    if (pick.tagline) patch.tagline = draft.tagline.slice(0, 200);
    if (pick.bio) patch.bio = draft.bio;
    if (pick.philosophy) patch.philosophy = draft.philosophy;
    if (pick.instructions) patch.instructions = draft.instructions;
    if (pick.boundaries) patch.boundaries = draft.boundaries;
    if (pick.welcomeMessage) patch.welcomeMessage = draft.welcomeMessage.slice(0, 1000);
    if (pick.starters) patch.starters = draft.starters;
    if (pick.tones) Object.assign(patch, { tones: draft.tones, responseLength: draft.responseLength });
    if (pick.ctaUrl && draft.ctaUrl) Object.assign(patch, { ctaUrl: draft.ctaUrl, ctaLabel: draft.ctaLabel.slice(0, 60) || "Work with me" });
    update(patch);
    if (pick.knowledgeNote && draft.knowledgeNote.trim()) {
      const res = await fetch(`/api/bots/${bot.id}/sources`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "text", title: "My method & common questions (from interview)", text: draft.knowledgeNote }),
      });
      if (res.ok) onSource((await res.json()).source);
    }
    setApplying(false);
    onDone();
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
        <span className="grid size-16 animate-pulse place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lift">
          <Sparkles className="size-7" />
        </span>
        <h2 className="mt-6 text-xl font-semibold tracking-tight">Drafting your mind…</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">Turning your answers into your voice, philosophy and coaching rules. This takes about a minute.</p>
      </div>
    );
  }

  if (draft) {
    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Here&apos;s your draft</h2>
          <p className="mt-1 text-sm text-muted">Untick anything you don&apos;t want. You can edit every field afterwards.</p>
        </div>
        <div className="space-y-3">
          {FIELDS.map(({ key: k, label }) => {
            const v = draft[k];
            const empty = Array.isArray(v) ? v.length === 0 : !v;
            if (empty) return null;
            return (
              <label key={k} className={cn("block cursor-pointer rounded-2xl border bg-white p-4 shadow-soft transition", pick[k] ? "border-violet-300" : "border-line opacity-60")}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!pick[k]} onChange={(e) => setPick({ ...pick, [k]: e.target.checked })} className="size-4 accent-violet-600" />
                  <span className="text-[13px] font-semibold">{label}</span>
                </div>
                <div className="mt-2 max-h-48 overflow-y-auto pl-7 text-sm leading-relaxed whitespace-pre-wrap text-zinc-700">
                  {k === "starters"
                    ? draft.starters.map((s) => `• ${s}`).join("\n")
                    : k === "tones"
                      ? `${draft.tones.map((t) => TONES.find((x) => x.id === t)?.label ?? t).join(", ")} · ${draft.responseLength} replies`
                      : k === "ctaUrl"
                        ? `${draft.ctaLabel || "Work with me"} → ${draft.ctaUrl}`
                        : String(v)}
                </div>
              </label>
            );
          })}
        </div>
        <div className="sticky bottom-0 mt-6 flex items-center gap-3 border-t border-line bg-canvas/90 py-4 backdrop-blur">
          <Button variant="ghost" onClick={() => setDraft(null)}>
            <ArrowLeft className="size-4" /> Edit answers
          </Button>
          <Button className="ml-auto" loading={applying} onClick={apply}>
            <Check className="size-4" /> Apply to my mind
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-soft">
          <Wand2 className="size-5" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Interview me</h2>
          <p className="mt-1 text-sm text-muted">Answer a few questions like you would on a podcast. We&apos;ll turn your answers into your mind&apos;s voice, philosophy and rules.</p>
        </div>
      </div>

      <div className="mb-4 flex gap-1">
        {INTERVIEW_QUESTIONS.map((x, i) => (
          <button
            key={x.id}
            onClick={() => setStep(i)}
            aria-label={`Question ${i + 1}`}
            className={cn("h-1.5 flex-1 rounded-full transition", i === step ? "bg-violet-600" : (answers[x.id] ?? "").trim() ? "bg-violet-300" : "bg-zinc-200")}
          />
        ))}
      </div>

      <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
        <div className="text-xs font-semibold tracking-wide text-violet-600 uppercase">
          Question {step + 1} of {INTERVIEW_QUESTIONS.length}
        </div>
        <h3 className="mt-2 text-lg leading-snug font-semibold">{q.q}</h3>
        <p className="mt-1 text-sm text-muted">{q.hint}</p>
        <Textarea
          key={q.id}
          autoFocus
          rows={7}
          className="mt-4"
          value={answers[q.id] ?? ""}
          placeholder="Type, or paste from your notes…"
          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
        />
        <div className="mt-4 flex items-center gap-2">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          <span className="ml-auto text-xs text-muted">{answered} answered</span>
          {step < INTERVIEW_QUESTIONS.length - 1 ? (
            <Button variant="secondary" onClick={() => setStep(step + 1)}>
              {(answers[q.id] ?? "").trim() ? "Next" : "Skip"} <ArrowRight className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
        <p className="flex-1 text-sm text-violet-900">{answered >= 3 ? "Ready when you are — more answers make a better draft." : `Answer at least ${3 - answered} more question${3 - answered === 1 ? "" : "s"} to draft your mind.`}</p>
        <Button disabled={answered < 3} onClick={generate}>
          <Sparkles className="size-4" /> Draft my mind
        </Button>
      </div>
    </>
  );
}
