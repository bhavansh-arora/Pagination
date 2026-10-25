"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Menu,
  MessageSquare,
  PanelLeftClose,
  RotateCcw,
  RefreshCw,
  Square,
  SquarePen,
  Trash2,
  UserRound,
  X,
  CircleCheck,
  Sparkles,
} from "lucide-react";
import { BotAvatar } from "../brand";
import { cn } from "@/lib/cn";
import { Markdown } from "./Markdown";
import { ClientAuthForm } from "./ClientAuth";
import { Paywall, type AccessStatus, type Offer } from "./Paywall";

export interface ChatBot {
  slug: string;
  name: string;
  coachName: string;
  tagline: string;
  avatarEmoji: string;
  avatarImage: string | null;
  brandColor: string;
  welcomeMessage: string;
  starters: string[];
  ctaLabel: string;
  ctaUrl: string;
  needsCode: boolean;
  paid?: boolean;
}

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };
type ConvoMeta = { id: string; title: string; updatedAt: string };

function storage(key: string, value?: string) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === "") localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  return null;
}

function visitorId(preview: boolean) {
  const key = preview ? "mc:preview-visitor" : "mc:visitor";
  let id = storage(key);
  if (!id) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 32);
    storage(key, id);
  }
  return id;
}

export function ChatView({ bot, mode }: { bot: ChatBot; mode: "public" | "preview" }) {
  const preview = mode === "preview";
  const [vid, setVid] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [locked, setLocked] = useState(bot.needsCode && !preview);
  const [convos, setConvos] = useState<ConvoMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [client, setClient] = useState<{ name: string; email: string } | null>(null);
  const [paywall, setPaywall] = useState<{ reason?: string } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const codeKey = `mc:code:${bot.slug}`;

  const headers = useCallback(
    (extra?: Record<string, string>) => ({ ...(code ? { "x-access-code": code } : {}), ...extra }),
    [code],
  );
  const q = useCallback(
    (params: Record<string, string>) => new URLSearchParams({ visitorId: vid ?? "", ...(preview ? { preview: "1" } : {}), ...params }).toString(),
    [vid, preview],
  );

  useEffect(() => {
    setVid(visitorId(preview));
    if (!preview) {
      const saved = storage(codeKey);
      if (saved) setCode(saved);
    }
  }, [preview, codeKey]);

  const loadList = useCallback(async () => {
    if (!vid) return;
    const res = await fetch(`/api/chat/${bot.slug}/conversations?${q({})}`, { headers: headers() });
    if (res.status === 403) {
      setLocked(true);
      return false;
    }
    if (!res.ok) return false;
    setLocked(false);
    setConvos((await res.json()).conversations);
    return true;
  }, [vid, bot.slug, q, headers]);

  const loadStatus = useCallback(async () => {
    if (!vid || preview) return null;
    const res = await fetch(`/api/chat/${bot.slug}/status?${q({})}`, { headers: headers() });
    if (!res.ok) return null;
    const data = await res.json();
    setStatus(data.state);
    setOffer(data.offer);
    setClient(data.client);
    return data.state as AccessStatus;
  }, [vid, preview, bot.slug, q, headers]);

  useEffect(() => {
    if (vid && (!bot.needsCode || preview || code)) {
      loadList();
      loadStatus();
    }
  }, [vid, code, loadList, loadStatus, bot.needsCode, preview]);

  // Back from Stripe Checkout: the webhook may land a moment after the redirect.
  useEffect(() => {
    if (preview || !vid) return;
    const url = new URL(window.location.href);
    const paid = url.searchParams.get("paid");
    if (!paid) return;
    url.searchParams.delete("paid");
    window.history.replaceState(null, "", url.toString());
    setToast(paid === "pack" ? "Payment received — your messages are being added." : "Payment received — welcome aboard!");
    let tries = 0;
    const timer = setInterval(async () => {
      const st = await loadStatus();
      if (++tries > 8 || (st && (st.membership || st.credits > 0))) {
        clearInterval(timer);
        if (st && (st.membership || st.credits > 0)) setToast(st.membership ? "You're a member — enjoy unlimited conversations." : `${st.credits} messages added to your account.`);
      }
    }, 1500);
    const hide = setTimeout(() => setToast(""), 9000);
    return () => {
      clearInterval(timer);
      clearTimeout(hide);
    };
  }, [vid, preview, loadStatus]);

  async function afterSignIn() {
    setAuthOpen(false);
    setActiveId(null);
    setMessages([]);
    storage(`mc:last:${bot.slug}`, "");
    await Promise.all([loadList(), loadStatus()]);
  }

  async function signOut() {
    await fetch("/api/client/logout", { method: "POST" });
    setClient(null);
    newChat();
    await Promise.all([loadList(), loadStatus()]);
  }

  const openSeq = useRef(0);
  const openConvo = useCallback(
    async (id: string) => {
      const seq = ++openSeq.current;
      setActiveId(id);
      setMessages([]);
      const res = await fetch(`/api/chat/${bot.slug}/conversations?${q({ id })}`, { headers: headers() });
      const d = res.ok ? await res.json() : null;
      if (seq !== openSeq.current) return;
      if (d?.conversation) setMessages(d.conversation.messages.map((m: Msg) => ({ role: m.role, content: m.content })));
      else {
        setActiveId(null);
        storage(`mc:last:${bot.slug}`, "");
      }
    },
    [bot.slug, q, headers],
  );

  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !vid || locked || preview) return;
    restored.current = true;
    const last = storage(`mc:last:${bot.slug}`);
    if (last) openConvo(last);
  }, [vid, locked, preview, bot.slug, openConvo]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function newChat() {
    abortRef.current?.abort();
    openSeq.current++;
    setActiveId(null);
    setMessages([]);
    setSidebar(false);
    if (!preview) storage(`mc:last:${bot.slug}`, "");
  }

  async function send(text?: string, regenerate = false) {
    const content = (text ?? input).trim();
    if (busy || !vid || (!content && !regenerate)) return;
    stick.current = true;
    setInput("");
    setBusy(true);
    setMessages((m) => {
      const base = regenerate ? dropTrailingAssistant(m) : [...m, { role: "user" as const, content }];
      return [...base, { role: "assistant", content: "" }];
    });
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const patchLast = (fn: (m: Msg) => Msg) =>
      setMessages((all) => {
        const next = all.slice();
        next[next.length - 1] = fn(next[next.length - 1]);
        return next;
      });
    try {
      const res = await fetch(`/api/chat/${bot.slug}`, {
        method: "POST",
        headers: headers({ "content-type": "application/json" }),
        signal: ctrl.signal,
        body: JSON.stringify({ visitorId: vid, conversationId: activeId, message: regenerate ? undefined : content, regenerate, accessCode: code || null, preview }),
      });
      if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        setMessages((all) => (regenerate ? all.slice(0, -1) : all.slice(0, -2)));
        if (!regenerate) setInput(content);
        if (data.paywall) {
          setStatus(data.paywall.state);
          setOffer(data.paywall.offer);
        }
        setPaywall({ reason: data.error });
        return;
      }
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => ({}))).error ?? "Something went wrong. Please try again.";
        if (res.status === 403) setLocked(true);
        patchLast(() => ({ role: "assistant", content: err, error: true }));
        return;
      }
      const id = res.headers.get("x-conversation-id");
      if (id && id !== activeId) {
        setActiveId(id);
        if (!preview) storage(`mc:last:${bot.slug}`, id);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const ev = JSON.parse(line) as { t: string; v?: string; message?: string };
          if (ev.t === "text") patchLast((m) => ({ ...m, content: m.content + ev.v }));
          if (ev.t === "error") patchLast((m) => ({ role: "assistant", content: m.content ? `${m.content}\n\n_${ev.message}_` : ev.message!, error: !m.content }));
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") patchLast(() => ({ role: "assistant", content: "Connection lost. Please try again.", error: true }));
    } finally {
      setBusy(false);
      abortRef.current = null;
      setMessages((all) => (all.at(-1)?.role === "assistant" && !all.at(-1)!.content ? all.slice(0, -1) : all));
      loadList();
      loadStatus();
    }
  }

  async function removeConvo(id: string) {
    await fetch(`/api/chat/${bot.slug}/conversations?${q({ id })}`, { method: "DELETE", headers: headers() });
    if (id === activeId) newChat();
    loadList();
  }

  async function unlock(entered: string) {
    const res = await fetch(`/api/chat/${bot.slug}/conversations?${q({})}`, { headers: { "x-access-code": entered } });
    if (!res.ok) return false;
    storage(codeKey, entered);
    setCode(entered);
    setLocked(false);
    return true;
  }

  const style = { "--accent": bot.brandColor } as React.CSSProperties;

  if (locked) return <AccessGate bot={bot} onUnlock={unlock} style={style} />;

  const empty = messages.length === 0;

  return (
    <div className="flex h-full min-h-0 bg-white" style={style}>
      {!preview && (
        <>
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-line bg-[#f8f7fa] transition-transform md:static md:translate-x-0",
              sidebar ? "translate-x-0 shadow-lift" : "-translate-x-full",
            )}
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{bot.name}</div>
                <div className="truncate text-xs text-muted">by {bot.coachName}</div>
              </div>
              <button className="rounded-lg p-1.5 text-muted hover:bg-black/5 md:hidden" onClick={() => setSidebar(false)} aria-label="Close menu">
                <PanelLeftClose className="size-4" />
              </button>
            </div>
            <div className="px-3">
              <button
                onClick={newChat}
                className="flex w-full items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium shadow-soft transition hover:border-zinc-300"
              >
                <SquarePen className="size-4 text-accent" /> New conversation
              </button>
            </div>
            <div className="scrollbar-thin mt-4 flex-1 overflow-y-auto px-3 pb-3">
              {convos.length > 0 && <div className="px-2 pb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">Your conversations</div>}
              {convos.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition",
                    c.id === activeId ? "bg-white font-medium shadow-soft" : "text-zinc-600 hover:bg-black/[0.04]",
                  )}
                >
                  <button
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => {
                      if (busy || c.id === activeId) return;
                      openConvo(c.id);
                      storage(`mc:last:${bot.slug}`, c.id);
                      setSidebar(false);
                    }}
                  >
                    <MessageSquare className="size-3.5 shrink-0 opacity-50" />
                    <span className="truncate">{c.title}</span>
                  </button>
                  <button
                    onClick={() => removeConvo(c.id)}
                    className="rounded p-1 text-muted opacity-0 transition group-hover:opacity-100 hover:text-rose-600"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-3 border-t border-line p-4">
              {status?.mode === "paid" && <PlanCard status={status} onUpgrade={() => setPaywall({})} />}
              {bot.ctaUrl && (
                <a
                  href={bot.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
                >
                  {bot.ctaLabel || `Work with ${bot.coachName.split(" ")[0]}`} <ExternalLink className="size-3.5" />
                </a>
              )}
              {client ? (
                <div className="flex items-center gap-2.5 rounded-xl bg-white p-2 shadow-soft">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                    {client.name.slice(0, 1).toUpperCase()}
                  </span>
                  <a href="/me" className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{client.name}</span>
                    <span className="block truncate text-[11px] text-muted">My account</span>
                  </a>
                  <button onClick={signOut} className="rounded-lg px-2 py-1 text-[11px] font-medium text-muted hover:bg-zinc-100 hover:text-ink">
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium shadow-soft hover:border-zinc-300"
                >
                  <UserRound className="size-4" /> Sign in to save your chats
                </button>
              )}
              <p className="text-center text-[11px] leading-relaxed text-muted">
                AI trained on {bot.coachName}&apos;s material. It can make mistakes. Conversations may be reviewed by {bot.coachName.split(" ")[0]}.
              </p>
            </div>
          </aside>
          {sidebar && <div className="fixed inset-0 z-30 bg-ink/20 md:hidden" onClick={() => setSidebar(false)} />}
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line/70 px-3">
          {!preview && (
            <button className="rounded-lg p-2 text-muted hover:bg-black/5 md:hidden" onClick={() => setSidebar(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </button>
          )}
          <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={28} className={cn(!preview && "md:hidden")} />
          <div className={cn("min-w-0 flex-1 text-sm font-semibold", !preview && "md:hidden")}>
            <span className="truncate">{bot.name}</span>
          </div>
          <div className={cn("hidden min-w-0 flex-1 truncate text-sm text-muted", !preview && "md:block")}>
            {convos.find((c) => c.id === activeId)?.title ?? ""}
          </div>
          {preview ? (
            <button onClick={newChat} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-black/5 hover:text-ink">
              <RotateCcw className="size-3.5" /> Reset
            </button>
          ) : (
            <>
              {!client && (
                <button onClick={() => setAuthOpen(true)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-black/5 hover:text-ink md:hidden">
                  Sign in
                </button>
              )}
              <button onClick={newChat} className="rounded-lg p-2 text-muted hover:bg-black/5 md:hidden" aria-label="New conversation">
                <SquarePen className="size-5" />
              </button>
            </>
          )}
        </header>

        <div
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="scrollbar-thin min-h-0 flex-1 overflow-y-auto"
        >
          {empty ? (
            <Welcome bot={bot} compact={preview} onPick={(s) => send(s)} />
          ) : (
            <div className={cn("mx-auto w-full space-y-7 px-4 py-8", preview ? "max-w-full" : "max-w-3xl")}>
              {messages.map((m, i) => (
                <Message
                  key={i}
                  m={m}
                  bot={bot}
                  streaming={busy && i === messages.length - 1}
                  canRegenerate={!busy && i === messages.length - 1 && m.role === "assistant"}
                  onRegenerate={() => send(undefined, true)}
                />
              ))}
            </div>
          )}
        </div>

        <div className={cn("mx-auto w-full shrink-0 px-4 pb-4", preview ? "max-w-full" : "max-w-3xl")}>
          {status?.mode === "paid" && !status.owner && <UsageHint status={status} onPlans={() => setPaywall({})} />}
          <Composer
            value={input}
            onChange={setInput}
            onSend={() => send()}
            onStop={() => abortRef.current?.abort()}
            busy={busy}
            placeholder={`Message ${bot.name}…`}
          />
          {!preview && <p className="mt-2 text-center text-[11px] text-muted md:hidden">AI trained on {bot.coachName}&apos;s material. It can make mistakes.</p>}
        </div>
      </div>

      {paywall && status && offer && (
        <Paywall
          bot={bot}
          offer={offer}
          status={status}
          visitorId={vid}
          accessCode={code}
          reason={paywall.reason}
          onClose={() => setPaywall(null)}
          onSignedIn={async () => {
            await afterSignIn();
            setPaywall({});
          }}
        />
      )}
      {authOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 backdrop-blur-sm sm:place-items-center sm:p-4" onClick={() => setAuthOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="relative w-full animate-fade-up rounded-t-3xl bg-white p-7 shadow-lift sm:max-w-[400px] sm:rounded-3xl">
            <button onClick={() => setAuthOpen(false)} className="absolute top-4 right-4 rounded-full p-1.5 text-muted hover:bg-zinc-100" aria-label="Close">
              <X className="size-4" />
            </button>
            <h2 className="text-lg font-semibold tracking-tight">Your {bot.name} account</h2>
            <p className="mt-1 mb-5 text-sm text-muted">Save your conversations and pick up on any device.</p>
            <ClientAuthForm visitorId={vid} onDone={afterSignIn} />
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 animate-fade-up items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lift">
          <CircleCheck className="size-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

function UsageHint({ status, onPlans }: { status: AccessStatus; onPlans: () => void }) {
  let text: string;
  if (status.membership) {
    const end = status.membership.currentPeriodEnd ? new Date(status.membership.currentPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;
    text = status.membership.cancelAtPeriodEnd && end ? `Member until ${end}` : "Member · unlimited conversations";
  } else if (status.trialLeft > 0) text = `${status.trialLeft} free message${status.trialLeft === 1 ? "" : "s"} left`;
  else if (status.credits > 0) text = `${status.credits.toLocaleString()} message${status.credits === 1 ? "" : "s"} left`;
  else text = "You've used your free messages";
  const showCta = !status.membership;
  return (
    <div className="mb-2 flex items-center justify-center gap-2 text-xs text-muted">
      {status.membership && <Sparkles className="size-3.5 text-accent" />}
      <span>{text}</span>
      {showCta && (
        <>
          <span className="text-zinc-300">·</span>
          <button onClick={onPlans} className="font-semibold text-accent hover:underline">
            {status.trialLeft > 0 || status.credits > 0 ? "See plans" : "Unlock access"}
          </button>
        </>
      )}
    </div>
  );
}

function PlanCard({ status, onUpgrade }: { status: AccessStatus; onUpgrade: () => void }) {
  if (status.membership) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2.5 text-xs font-medium text-ink">
        <Sparkles className="size-4 text-accent" /> Member
        <a href="/me" className="ml-auto text-muted hover:text-ink">
          Manage
        </a>
      </div>
    );
  }
  return (
    <button onClick={onUpgrade} className="w-full rounded-xl border border-accent bg-accent-soft px-3 py-2.5 text-left">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
        <Sparkles className="size-3.5 text-accent" /> Unlock unlimited access
      </div>
      <div className="mt-0.5 text-[11px] text-muted">
        {status.trialLeft > 0 ? `${status.trialLeft} free messages left` : status.credits > 0 ? `${status.credits} messages left` : "Free messages used"}
      </div>
    </button>
  );
}

function dropTrailingAssistant(m: Msg[]) {
  const out = m.slice();
  while (out.at(-1)?.role === "assistant") out.pop();
  return out;
}

function Welcome({ bot, onPick, compact }: { bot: ChatBot; onPick: (s: string) => void; compact: boolean }) {
  return (
    <div className={cn("mx-auto flex min-h-full max-w-2xl animate-fade-up flex-col items-center justify-center px-5 text-center", compact ? "py-8" : "py-12")}>
      <div className="relative">
        <div className="absolute inset-0 -z-10 scale-150 rounded-full blur-2xl" style={{ background: `color-mix(in srgb, ${bot.brandColor} 25%, transparent)` }} />
        <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={compact ? 64 : 84} className="ring-4 ring-white" />
      </div>
      <h1 className={cn("mt-5 font-semibold tracking-tight", compact ? "text-xl" : "text-2xl sm:text-[28px]")}>{bot.name}</h1>
      {bot.tagline && <p className="mt-1.5 max-w-md text-sm text-muted">{bot.tagline}</p>}
      {bot.welcomeMessage && (
        <div className="mt-6 max-w-lg rounded-2xl border border-line bg-white px-5 py-4 text-left text-[15px] leading-relaxed text-zinc-700 shadow-soft">
          {bot.welcomeMessage}
        </div>
      )}
      {bot.starters.length > 0 && (
        <div className={cn("mt-6 grid w-full gap-2.5", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
          {bot.starters.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="rounded-xl border border-line bg-white px-4 py-3 text-left text-sm text-zinc-700 shadow-soft transition hover:-translate-y-px hover:border-accent hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Message({
  m,
  bot,
  streaming,
  canRegenerate,
  onRegenerate,
}: {
  m: Msg;
  bot: ChatBot;
  streaming: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-accent-soft px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-ink">
          {m.content}
        </div>
      </div>
    );
  }
  return (
    <div className="group flex gap-3.5">
      <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={30} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        {m.content ? (
          m.error ? (
            <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{m.content}</p>
          ) : (
            <Markdown text={m.content} />
          )
        ) : (
          <div className="flex h-7 items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
        {!streaming && m.content && !m.error && (
          <div className="mt-1.5 flex gap-0.5 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
            <button
              onClick={() => {
                navigator.clipboard.writeText(m.content);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-md p-1.5 text-muted hover:bg-black/5 hover:text-ink"
              aria-label="Copy"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
            {canRegenerate && (
              <button onClick={onRegenerate} className="rounded-md p-1.5 text-muted hover:bg-black/5 hover:text-ink" aria-label="Regenerate">
                <RefreshCw className="size-3.5" />
              </button>
            )}
          </div>
        )}
        {m.error && canRegenerate && (
          <button onClick={onRegenerate} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink">
            <RefreshCw className="size-3.5" /> Try again
          </button>
        )}
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);
  return (
    <div className="flex items-end gap-2 rounded-[26px] border border-line bg-white p-2 pl-4 shadow-[0_8px_30px_-12px_rgb(22_19_31/0.18)] transition focus-within:border-zinc-300">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={placeholder}
        className="max-h-[220px] min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed outline-none placeholder:text-zinc-400"
      />
      {busy ? (
        <button onClick={onStop} className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white transition hover:opacity-85" aria-label="Stop">
          <Square className="size-3.5 fill-current" />
        </button>
      ) : (
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-white transition hover:opacity-90 disabled:bg-zinc-200 disabled:text-zinc-400"
          aria-label="Send"
        >
          <ArrowUp className="size-[18px]" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

function AccessGate({ bot, onUnlock, style }: { bot: ChatBot; onUnlock: (code: string) => Promise<boolean>; style: React.CSSProperties }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <div className="grid h-full place-items-center bg-[#f8f7fa] px-4" style={style}>
      <form
        className="w-full max-w-sm animate-fade-up rounded-3xl border border-line bg-white p-8 text-center shadow-lift"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(!(await onUnlock(value.trim())));
          setLoading(false);
        }}
      >
        <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={72} className="mx-auto" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">{bot.name}</h1>
        <p className="mt-1.5 text-sm text-muted">This mind is private. Enter the access code {bot.coachName} gave you.</p>
        <div className="relative mt-6">
          <KeyRound className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="Access code"
            className="h-11 w-full rounded-xl border border-line pr-3 pl-10 text-sm outline-none focus:border-accent focus:ring-4 ring-accent"
          />
        </div>
        {error && <p className="mt-2 text-sm text-rose-600">That code didn&apos;t work. Check with {bot.coachName.split(" ")[0]}.</p>}
        <button
          disabled={!value.trim() || loading}
          className="mt-4 h-11 w-full rounded-xl bg-accent text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Checking…" : "Start talking"}
        </button>
      </form>
    </div>
  );
}
