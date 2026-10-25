"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  CircleAlert,
  Cpu,
  ExternalLink,
  Loader2,
  MessagesSquare,
  PanelRightClose,
  PanelRightOpen,
  Rocket,
  Share2,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import type { Bot, Source } from "@/lib/db";
import { cn } from "@/lib/cn";
import { BotAvatar } from "../brand";
import { Button } from "../ui";
import { ChatView, type ChatBot } from "../chat/ChatView";
import { BrainSection, ExperienceSection, IdentitySection, MindSection, ShareSection } from "./sections";
import { KnowledgeSection } from "./KnowledgeSection";
import { ConversationsSection } from "./ConversationsSection";

export type Update = (patch: Partial<Bot>) => void;

const NAV = [
  { id: "identity", label: "Identity", icon: UserRound, hint: "Name, look & link" },
  { id: "mind", label: "Mind & voice", icon: Brain, hint: "How you think & talk" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, hint: "Files, links & notes" },
  { id: "experience", label: "Client experience", icon: Sparkles, hint: "Welcome & prompts" },
  { id: "brain", label: "AI engine", icon: Cpu, hint: "Model & depth" },
  { id: "share", label: "Publish & share", icon: Share2, hint: "Link, access, embed" },
  { id: "conversations", label: "Conversations", icon: MessagesSquare, hint: "What clients ask" },
] as const;

type Tab = (typeof NAV)[number]["id"];
type SaveState = "idle" | "saving" | "saved" | "error";

export function Editor({
  initialBot,
  initialSources,
  conversationCount,
  fullMemoryChars,
}: {
  initialBot: Bot;
  initialSources: Source[];
  conversationCount: number;
  fullMemoryChars: number;
}) {
  const [bot, setBot] = useState(initialBot);
  const [sources, setSources] = useState(initialSources);
  const [tab, setTab] = useState<Tab>("identity");
  const [save, setSave] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const pending = useRef<Partial<Bot>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<unknown>>(Promise.resolve());
  const savedSlug = useRef(initialBot.slug);

  const flush = useCallback(() => {
    const patch = pending.current;
    pending.current = {};
    if (!Object.keys(patch).length) return inflight.current;
    setSave("saving");
    inflight.current = inflight.current.then(async () => {
      const res = await fetch(`/api/bots/${initialBot.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSave("error");
        setSaveError(data.error ?? "Couldn't save");
        if (patch.slug !== undefined) setBot((b) => ({ ...b, slug: savedSlug.current }));
        return false;
      }
      savedSlug.current = data.bot.slug;
      setBot((b) => ({ ...b, slug: data.bot.slug, updatedAt: data.bot.updatedAt }));
      setSave("saved");
      setSaveError("");
      return true;
    });
    return inflight.current;
  }, [initialBot.id]);

  const update: Update = useCallback(
    (patch) => {
      setBot((b) => ({ ...b, ...patch }));
      pending.current = { ...pending.current, ...patch };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 600);
    },
    [flush],
  );

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) {
        flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [flush]);

  async function setPublished(published: boolean) {
    if (timer.current) clearTimeout(timer.current);
    pending.current = { ...pending.current, published };
    const prev = bot.published;
    setBot((b) => ({ ...b, published }));
    const ok = await flush();
    if (!ok) setBot((b) => ({ ...b, published: prev }));
  }

  const chatBot: ChatBot = useMemo(
    () => ({
      slug: bot.slug,
      name: bot.name,
      coachName: bot.coachName,
      tagline: bot.tagline,
      avatarEmoji: bot.avatarEmoji,
      avatarImage: bot.avatarImage,
      brandColor: bot.brandColor,
      welcomeMessage: bot.welcomeMessage,
      starters: bot.starters.filter(Boolean),
      ctaLabel: bot.ctaLabel,
      ctaUrl: bot.ctaUrl,
      needsCode: false,
    }),
    [bot],
  );

  const checklist = [
    { done: !!bot.tagline && !!bot.coachName, label: "Identity", tab: "identity" as Tab },
    { done: bot.bio.length > 40 || bot.philosophy.length > 40, label: "Your mind & voice", tab: "mind" as Tab },
    { done: sources.length > 0, label: "Add knowledge", tab: "knowledge" as Tab },
    { done: bot.starters.filter(Boolean).length > 0, label: "Conversation starters", tab: "experience" as Tab },
    { done: bot.published, label: "Go live", tab: "share" as Tab },
  ];
  const progress = checklist.filter((c) => c.done).length;

  const section = (() => {
    switch (tab) {
      case "identity":
        return <IdentitySection bot={bot} update={update} />;
      case "mind":
        return <MindSection bot={bot} update={update} />;
      case "knowledge":
        return <KnowledgeSection botId={bot.id} sources={sources} setSources={setSources} fullMemoryChars={fullMemoryChars} />;
      case "experience":
        return <ExperienceSection bot={bot} update={update} />;
      case "brain":
        return <BrainSection bot={bot} update={update} />;
      case "share":
        return <ShareSection bot={bot} update={update} setPublished={setPublished} />;
      case "conversations":
        return <ConversationsSection bot={bot} initialCount={conversationCount} />;
    }
  })();

  const previewPanel = (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-line bg-zinc-50/70 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" /> Live playground
        </div>
        <span className="text-[11px] text-muted">Test exactly what clients will get</span>
      </div>
      <div className="min-h-0 flex-1">
        <ChatView key={bot.id} bot={chatBot} mode="preview" />
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white/80 px-4 backdrop-blur-xl sm:px-6">
        <Link href="/dashboard" className="rounded-lg p-2 text-muted hover:bg-black/5 hover:text-ink" aria-label="Back to dashboard">
          <ArrowLeft className="size-[18px]" />
        </Link>
        <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={34} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[15px] font-semibold">{bot.name}</h1>
            {bot.published ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Live
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/70">Draft</span>
            )}
          </div>
          <SaveIndicator state={save} error={saveError} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={`/c/${bot.slug}`}
            target="_blank"
            rel="noopener"
            className="hidden h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink sm:inline-flex"
          >
            Open <ExternalLink className="size-3.5" />
          </a>
          <button
            onClick={() => (window.matchMedia("(min-width: 1280px)").matches ? setShowPreview((v) => !v) : setDrawer(true))}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm font-medium shadow-soft hover:bg-zinc-50"
          >
            {showPreview ? <PanelRightClose className="size-4 max-xl:hidden" /> : <PanelRightOpen className="size-4 max-xl:hidden" />}
            <MessagesSquare className="size-4 xl:hidden" />
            <span className="hidden sm:inline">Test chat</span>
          </button>
          {bot.published ? (
            <Button variant="secondary" size="sm" className="h-9" onClick={() => setTab("share")}>
              <Share2 className="size-4" /> Share
            </Button>
          ) : (
            <Button size="sm" className="h-9" onClick={() => setPublished(true)}>
              <Rocket className="size-4" /> Publish
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="scrollbar-thin hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-line bg-white/60 p-3 lg:flex">
          {NAV.map(({ id, label, icon: Icon, hint }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                tab === id ? "bg-violet-50 text-violet-900" : "text-zinc-600 hover:bg-black/[0.03] hover:text-ink",
              )}
            >
              <span className={cn("grid size-8 place-items-center rounded-lg", tab === id ? "bg-white text-violet-600 shadow-soft" : "bg-zinc-100 text-zinc-500")}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold">{label}</span>
                <span className="block truncate text-[11px] text-muted">{hint}</span>
              </span>
              {id === "knowledge" && sources.length > 0 && (
                <span className="ml-auto rounded-full bg-zinc-100 px-1.5 text-[11px] font-semibold text-zinc-600">{sources.length}</span>
              )}
            </button>
          ))}

          <div className="mt-auto rounded-2xl border border-line bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold">Training progress</span>
              <span className="text-xs font-semibold text-violet-600">
                {progress}/{checklist.length}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${(progress / checklist.length) * 100}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1.5">
              {checklist.map((c) => (
                <li key={c.label}>
                  <button onClick={() => setTab(c.tab)} className="flex w-full items-center gap-2 text-left text-xs text-zinc-600 hover:text-ink">
                    <span className={cn("grid size-4 place-items-center rounded-full", c.done ? "bg-emerald-500 text-white" : "border border-zinc-300")}>
                      {c.done && <Check className="size-2.5" strokeWidth={3} />}
                    </span>
                    <span className={cn(c.done && "text-muted line-through")}>{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-line bg-white/90 px-3 py-2 backdrop-blur lg:hidden">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
                  tab === id ? "bg-violet-50 text-violet-800" : "text-muted",
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
          <div key={tab} className="mx-auto max-w-3xl animate-fade-up px-4 py-8 sm:px-8">
            {section}
          </div>
        </main>

        {showPreview && <aside className="hidden w-[440px] shrink-0 p-4 pl-0 xl:block 2xl:w-[500px]">{previewPanel}</aside>}
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-sm xl:hidden" onClick={() => setDrawer(false)}>
          <div className="relative h-full w-full max-w-[480px] animate-fade-up p-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setDrawer(false)}
              className="absolute top-5 right-5 z-10 rounded-lg bg-white p-1.5 text-muted shadow-soft hover:text-ink"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            {previewPanel}
          </div>
        </div>
      )}
    </div>
  );
}

function SaveIndicator({ state, error }: { state: SaveState; error: string }) {
  if (state === "saving")
    return (
      <div className="flex items-center gap-1 text-[11px] text-muted">
        <Loader2 className="size-3 animate-spin" /> Saving…
      </div>
    );
  if (state === "error")
    return (
      <div className="flex items-center gap-1 text-[11px] text-rose-600">
        <CircleAlert className="size-3" /> {error}
      </div>
    );
  if (state === "saved")
    return (
      <div className="flex items-center gap-1 text-[11px] text-emerald-600">
        <Check className="size-3" /> All changes saved
      </div>
    );
  return <div className="text-[11px] text-muted">Changes save automatically</div>;
}
