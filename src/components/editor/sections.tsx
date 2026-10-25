"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Code2, Copy, ExternalLink, Globe, ImagePlus, KeyRound, Lock, Plus, Shuffle, Trash2, Wand2 } from "lucide-react";
import type { Bot } from "@/lib/db";
import { BRAND_COLORS, DEPTHS, LENGTHS, MODELS, TONES } from "@/lib/models";
import { cn } from "@/lib/cn";
import { BotAvatar } from "../brand";
import { Button, Field, Input, Section, Segmented, Switch, Textarea } from "../ui";
import type { Update } from "./Editor";

type Props = { bot: Bot; update: Update };

const EMOJIS = ["✨", "🌿", "🔥", "🧠", "🌊", "☀️", "🦋", "🚀", "💎", "🧘", "🎯", "💪", "🌱", "🦁", "🕊️", "🌙", "❤️", "⚡", "🏔️", "🎨"];

export function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
    </div>
  );
}

async function resizeImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const s = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
    return canvas.toDataURL("image/webp", 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function IdentitySection({ bot, update }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <PageTitle title="Identity" subtitle="How your mind looks and introduces itself to clients." />
      <div className="space-y-5">
        <Section title="Avatar & brand" description="Use your photo for the most personal feel, or pick an emoji.">
          <div className="flex flex-wrap items-center gap-5">
            <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={88} className="ring-4 ring-white shadow-soft" />
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) update({ avatarImage: await resizeImage(f) });
                  e.target.value = "";
                }}
              />
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="size-4" /> Upload photo
              </Button>
              {bot.avatarImage && (
                <Button variant="ghost" size="sm" onClick={() => update({ avatarImage: null })}>
                  <Trash2 className="size-4" /> Use emoji instead
                </Button>
              )}
            </div>
          </div>
          {!bot.avatarImage && (
            <div className="grid grid-cols-10 gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => update({ avatarEmoji: e })}
                  className={cn("grid aspect-square place-items-center rounded-xl text-xl transition", bot.avatarEmoji === e ? "bg-violet-100 ring-2 ring-violet-400" : "hover:bg-zinc-100")}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
          <div>
            <div className="mb-2 text-[13px] font-semibold">Accent color</div>
            <div className="flex flex-wrap items-center gap-2">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => update({ brandColor: c })}
                  className={cn("grid size-8 place-items-center rounded-full ring-offset-2 transition", bot.brandColor === c && "ring-2 ring-zinc-900")}
                  style={{ background: c }}
                  aria-label={c}
                >
                  {bot.brandColor === c && <Check className="size-4 text-white" />}
                </button>
              ))}
              <label className="relative grid size-8 cursor-pointer place-items-center rounded-full border border-dashed border-zinc-300 text-muted hover:border-zinc-400">
                <Plus className="size-4" />
                <input type="color" value={bot.brandColor} onChange={(e) => update({ brandColor: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
              </label>
            </div>
          </div>
        </Section>

        <Section title="Basics">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Mind name" hint="Shown at the top of the chat.">
              <Input value={bot.name} maxLength={60} onChange={(e) => update({ name: e.target.value })} />
            </Field>
            <Field label="Your name (as clients know you)" hint="The AI speaks as this person.">
              <Input value={bot.coachName} maxLength={80} onChange={(e) => update({ coachName: e.target.value })} />
            </Field>
          </div>
          <Field label="Tagline" hint="One line on who this is for and what it helps with." aside={`${bot.tagline.length}/200`}>
            <Input
              value={bot.tagline}
              maxLength={200}
              placeholder="Helping first-time founders build calm, profitable businesses"
              onChange={(e) => update({ tagline: e.target.value })}
            />
          </Field>
        </Section>
      </div>
    </>
  );
}

const INSTRUCTION_SNIPPETS = [
  "Ask one powerful question to understand the situation before giving advice.",
  "End most replies with one small, concrete action step.",
  "Refer to my frameworks by name and walk people through them step by step.",
  "Gently challenge limiting beliefs and excuses — with compassion.",
  "Celebrate wins, however small, before moving on.",
  "Use real-life examples and analogies instead of theory.",
];

export function MindSection({ bot, update }: Props) {
  const toggleTone = (t: Bot["tones"][number]) =>
    update({ tones: bot.tones.includes(t) ? bot.tones.filter((x) => x !== t) : [...bot.tones, t] });
  return (
    <>
      <PageTitle title="Mind & voice" subtitle="Teach your AI who you are, what you believe and how you coach. The more specific, the more it sounds like you." />
      <div className="space-y-5">
        <Section title="Who you are" description="Your story, background and who you serve. Write in first person.">
          <Textarea
            rows={5}
            value={bot.bio}
            maxLength={8000}
            placeholder="I'm a former corporate lawyer turned career coach. After burning out at 32, I rebuilt my life around work that energizes me. Now I help ambitious women in their 30s make bold career changes without blowing up their finances…"
            onChange={(e) => update({ bio: e.target.value })}
          />
        </Section>

        <Section title="Coaching philosophy" description="Core beliefs, principles and signature frameworks — the way you see the world.">
          <Textarea
            rows={5}
            value={bot.philosophy}
            maxLength={8000}
            placeholder={"• Clarity comes from action, not more thinking.\n• My 3C framework: Clarity → Courage → Consistency.\n• Small daily promises kept build unshakable confidence."}
            onChange={(e) => update({ philosophy: e.target.value })}
          />
        </Section>

        <Section title="Voice" description="How your mind should sound.">
          <div>
            <div className="mb-2 text-[13px] font-semibold">Tone</div>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => {
                const on = bot.tones.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTone(t.id)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition",
                      on ? "border-violet-300 bg-violet-50 text-violet-800" : "border-line bg-white text-zinc-600 hover:border-zinc-300",
                    )}
                  >
                    {on && <Check className="mr-1 -ml-0.5 inline size-3.5" />}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[13px] font-semibold">Reply length</div>
            <Segmented value={bot.responseLength} options={LENGTHS} onChange={(v) => update({ responseLength: v })} />
          </div>
        </Section>

        <Section
          title="Coaching instructions"
          description="Specific rules for how to run a conversation. Click a suggestion to add it."
        >
          <div className="flex flex-wrap gap-1.5">
            {INSTRUCTION_SNIPPETS.filter((s) => !bot.instructions.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => update({ instructions: (bot.instructions.trim() ? bot.instructions.trimEnd() + "\n" : "") + `- ${s}` })}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-left text-xs text-zinc-700 transition hover:bg-violet-100 hover:text-violet-800"
              >
                <Plus className="size-3" /> {s}
              </button>
            ))}
          </div>
          <Textarea
            rows={7}
            value={bot.instructions}
            maxLength={20000}
            placeholder="- Always ask what outcome they want from this conversation.\n- Never give generic productivity tips; tie everything back to their values."
            onChange={(e) => update({ instructions: e.target.value })}
          />
        </Section>

        <Section title="Boundaries" description="Topics to avoid or redirect. Safety guardrails for crisis, medical and legal topics are always on.">
          <Textarea
            rows={3}
            value={bot.boundaries}
            maxLength={4000}
            placeholder="Don't discuss my pricing — direct people to book a discovery call. Don't give advice on relationships; that's outside my expertise."
            onChange={(e) => update({ boundaries: e.target.value })}
          />
        </Section>
      </div>
    </>
  );
}

export function ExperienceSection({ bot, update }: Props) {
  const starters = [...bot.starters, "", "", "", ""].slice(0, 4);
  return (
    <>
      <PageTitle title="Client experience" subtitle="What clients see when they open a new conversation." />
      <div className="space-y-5">
        <Section title="Welcome message" description="The first thing your mind says.">
          <Textarea rows={3} value={bot.welcomeMessage} maxLength={1000} onChange={(e) => update({ welcomeMessage: e.target.value })} />
        </Section>
        <Section title="Conversation starters" description="Up to four one-tap prompts that show clients what to ask.">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {starters.map((s, i) => (
              <Input
                key={i}
                value={s}
                maxLength={140}
                placeholder={["I feel stuck in my career…", "Help me plan my week", "How do I stop overthinking?", "Walk me through your framework"][i]}
                onChange={(e) => {
                  const next = starters.slice();
                  next[i] = e.target.value;
                  update({ starters: next.map((x) => x.slice(0, 140)).filter((x, j) => x || j < next.findLastIndex(Boolean)) });
                }}
              />
            ))}
          </div>
        </Section>
        <Section title="Call to action" description="Optional. A button in the chat, and your mind will suggest it when someone wants deeper support.">
          <div className="grid gap-5 sm:grid-cols-[1fr_1.5fr]">
            <Field label="Button label">
              <Input value={bot.ctaLabel} maxLength={60} placeholder="Book a 1:1 session" onChange={(e) => update({ ctaLabel: e.target.value })} />
            </Field>
            <Field label="Link">
              <Input value={bot.ctaUrl} maxLength={500} placeholder="https://calendly.com/you" onChange={(e) => update({ ctaUrl: e.target.value })} />
            </Field>
          </div>
        </Section>
      </div>
    </>
  );
}

export function BrainSection({ bot, update }: Props) {
  return (
    <>
      <PageTitle title="AI engine" subtitle="Choose the model behind your mind and how much it reflects before replying." />
      <div className="space-y-5">
        <Section title="Model">
          <div className="grid gap-2.5">
            {MODELS.map((m, i) => (
              <button
                key={m.id}
                onClick={() => update({ model: m.id })}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-4 text-left transition",
                  bot.model === m.id ? "border-violet-400 bg-violet-50/60 ring-4 ring-violet-100" : "border-line hover:border-zinc-300",
                )}
              >
                <span className={cn("grid size-5 place-items-center rounded-full border-2", bot.model === m.id ? "border-violet-600" : "border-zinc-300")}>
                  {bot.model === m.id && <span className="size-2.5 rounded-full bg-violet-600" />}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {m.label}
                    {i === 0 && <span className="rounded-full bg-violet-600 px-1.5 py-px text-[10px] font-semibold text-white">Recommended</span>}
                  </span>
                  <span className="text-xs text-muted">{m.blurb}</span>
                </span>
              </button>
            ))}
          </div>
        </Section>
        <Section title="Thinking depth" description="Deeper thinking gives more considered coaching but replies take a little longer.">
          <Segmented value={bot.depth} options={DEPTHS} onChange={(v) => update({ depth: v })} />
        </Section>
      </div>
    </>
  );
}

function CopyField({ value, icon: Icon }: { value: string; icon: typeof Globe }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-zinc-50 p-1.5 pl-3">
      <Icon className="size-4 shrink-0 text-muted" />
      <code className="min-w-0 flex-1 truncate text-[13px] text-zinc-700">{value}</code>
      <Button
        variant="secondary"
        size="sm"
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

export function ShareSection({ bot, update, setPublished }: Props & { setPublished: (v: boolean) => void }) {
  const [origin, setOrigin] = useState("");
  const [slug, setSlug] = useState(bot.slug);
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => setSlug(bot.slug), [bot.slug]);
  const link = `${origin}/c/${bot.slug}`;
  const embed = `<iframe src="${link}" style="width:100%;height:640px;border:0;border-radius:16px" allow="clipboard-write"></iframe>`;
  const randomCode = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("") + "-" + Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");

  return (
    <>
      <PageTitle title="Publish & share" subtitle="Put your mind in front of clients." />
      <div className="space-y-5">
        <div
          className={cn(
            "flex items-center gap-4 rounded-2xl border p-5 transition",
            bot.published ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white" : "border-line bg-white shadow-soft",
          )}
        >
          <div className="flex-1">
            <div className="font-semibold">{bot.published ? "Your mind is live 🎉" : "Your mind is a draft"}</div>
            <div className="mt-0.5 text-sm text-muted">
              {bot.published ? "Anyone with the link can talk to it." : "Only you can test it. Publish when you're happy with how it responds."}
            </div>
          </div>
          <Switch checked={bot.published} onChange={setPublished} label="Published" />
        </div>

        <Section title="Who can chat">
          <Segmented
            value={bot.visibility}
            options={[
              { id: "public", label: "Anyone with the link", blurb: "Great for lead generation" },
              { id: "code", label: "Access code", blurb: "For paying clients only" },
            ]}
            onChange={(v) => update({ visibility: v, ...(v === "code" && !bot.accessCode ? { accessCode: randomCode() } : {}) })}
          />
          {bot.visibility === "code" && (
            <Field label="Access code" hint="Share this with your clients. Changing it locks out anyone using the old code.">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                  <Input className="pl-9 font-mono" value={bot.accessCode} maxLength={60} onChange={(e) => update({ accessCode: e.target.value })} />
                </div>
                <Button variant="secondary" onClick={() => update({ accessCode: randomCode() })}>
                  <Shuffle className="size-4" /> New
                </Button>
              </div>
            </Field>
          )}
        </Section>

        <Section title="Your link" description="Send it in emails, put it in your bio, or add it to your course portal.">
          <CopyField value={link} icon={bot.visibility === "code" ? Lock : Globe} />
          <Field label="Custom link name" hint="Letters, numbers and dashes.">
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-xl border border-line bg-white pl-3.5 text-sm text-muted focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
                <span className="shrink-0">{origin.replace(/^https?:\/\//, "")}/c/</span>
                <input
                  className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-ink outline-none"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                />
              </div>
              <Button variant="secondary" disabled={slug === bot.slug || slug.length < 2} onClick={() => update({ slug })}>
                Save
              </Button>
            </div>
          </Field>
          <a href={link} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:underline">
            Open your mind <ExternalLink className="size-3.5" />
          </a>
        </Section>

        <Section title="Embed on your website" description="Paste this into Webflow, WordPress, Kajabi, Squarespace or any HTML block.">
          <CopyField value={embed} icon={Code2} />
        </Section>

        <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-sm text-violet-900">
          <Wand2 className="mt-0.5 size-4 shrink-0" />
          <p>
            Tip: before sharing, use the <b>Test chat</b> panel to ask the questions your clients ask most. If an answer isn&apos;t quite you, add a note in{" "}
            <b>Knowledge</b> or tighten your <b>Coaching instructions</b>.
          </p>
        </div>
      </div>
    </>
  );
}
