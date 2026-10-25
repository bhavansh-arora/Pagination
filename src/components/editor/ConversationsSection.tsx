"use client";
import { useEffect, useMemo, useState } from "react";
import { Brain, Check, Loader2, MessagesSquare, PencilLine, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import type { Bot, Conversation } from "@/lib/db";
import { cn } from "@/lib/cn";
import { BotAvatar } from "../brand";
import { Button, Card, Textarea } from "../ui";
import { Markdown } from "../chat/Markdown";
import { PageTitle } from "./sections";

type Convo = Conversation & { client: string | null };

export function ConversationsSection({ bot, initialCount }: { bot: Bot; initialCount: number }) {
  const [list, setList] = useState<Convo[] | null>(null);
  const [memories, setMemories] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "down">("all");
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/bots/${bot.id}/conversations`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.conversations ?? []);
        setMemories(d.memories ?? {});
        setActive(d.conversations?.[0]?.id ?? null);
      });
  }, [bot.id]);

  const stats = useMemo(() => {
    const all = list ?? [];
    const replies = all.flatMap((c) => c.messages.filter((m) => m.role === "assistant"));
    const down = all.flatMap((c) => c.messages.map((m, i) => ({ c, m, i })).filter((x) => x.m.role === "assistant" && x.m.rating === "down" && !x.m.correction));
    const questions = all
      .map((c) => ({ c, q: c.messages.find((m) => m.role === "user") }))
      .filter((x) => x.q)
      .slice(0, 8);
    return {
      convos: all.length,
      visitors: new Set(all.map((c) => c.visitorId)).size,
      up: replies.filter((m) => m.rating === "up").length,
      down: replies.filter((m) => m.rating === "down").length,
      fixed: replies.filter((m) => m.correction).length,
      needsWork: down,
      questions,
    };
  }, [list]);

  const shown = (list ?? []).filter((c) => filter === "all" || c.messages.some((m) => m.rating === "down"));
  const current = list?.find((c) => c.id === active);

  async function saveCorrection(index: number) {
    if (!current) return;
    setSaving(true);
    const res = await fetch(`/api/bots/${bot.id}/corrections`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId: current.id, index, answer: draft }),
    });
    setSaving(false);
    if (!res.ok) return alert((await res.json().catch(() => ({}))).error ?? "Couldn't save");
    setList((l) => l!.map((c) => (c.id === current.id ? { ...c, messages: c.messages.map((m, i) => (i === index ? { ...m, correction: draft } : m)) } : c)));
    setEditing(null);
  }

  return (
    <>
      <PageTitle title="Conversations" subtitle="See what clients ask, how your mind answers, and fix anything that isn't quite you." />
      {list === null ? (
        <div className="grid place-items-center py-20 text-muted">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <MessagesSquare className="mx-auto size-8 text-zinc-300" />
          <div className="mt-3 font-semibold">No client conversations yet</div>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {initialCount === 0 && !bot.published ? "Publish your mind and share the link — conversations will appear here." : "Share your link and conversations will appear here."}
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Conversations", stats.convos],
              ["People", stats.visitors],
              ["Helpful 👍", stats.up],
              ["Not helpful 👎", stats.down],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-line bg-white p-4 shadow-soft">
                <div className="text-xs font-semibold text-muted">{l}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{v}</div>
              </div>
            ))}
          </div>

          {stats.needsWork.length > 0 && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <ThumbsDown className="size-4" /> {stats.needsWork.length} repl{stats.needsWork.length === 1 ? "y" : "ies"} clients didn&apos;t find helpful
              </div>
              <ul className="mt-2 space-y-1">
                {stats.needsWork.slice(0, 5).map(({ c, i }) => (
                  <li key={`${c.id}-${i}`}>
                    <button
                      onClick={() => {
                        setActive(c.id);
                        setEditing(null);
                      }}
                      className="w-full truncate text-left text-sm text-amber-900 underline-offset-2 hover:underline"
                    >
                      “{[...c.messages.slice(0, i)].reverse().find((m) => m.role === "user")?.content.slice(0, 90)}”
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-amber-800">Open one and use “Improve this answer” — your fix becomes part of your mind&apos;s knowledge.</p>
            </div>
          )}

          <Card className="grid h-[640px] overflow-hidden md:grid-cols-[250px_1fr]">
            <div className="flex min-h-0 flex-col border-b border-line md:border-r md:border-b-0">
              <div className="flex gap-1 border-b border-line p-2">
                {(["all", "down"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn("flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold", filter === f ? "bg-violet-50 text-violet-800" : "text-muted hover:text-ink")}
                  >
                    {f === "all" ? "All" : "👎 Needs work"}
                  </button>
                ))}
              </div>
              <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
                {shown.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setActive(c.id);
                        setEditing(null);
                      }}
                      className={cn("w-full border-b border-line/60 px-4 py-3 text-left transition", c.id === active ? "bg-violet-50/70" : "hover:bg-zinc-50")}
                    >
                      <div className="truncate text-sm font-medium">{c.title}</div>
                      <div className="mt-0.5 truncate text-[11px] text-muted">
                        {c.client ?? "Anonymous visitor"} · {c.messages.length} messages · {new Date(c.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="scrollbar-thin min-h-0 space-y-5 overflow-y-auto bg-zinc-50/40 p-5">
              {current && memories[current.visitorId] && (
                <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-800">
                    <Brain className="size-3.5" /> What your mind remembers about {current.client ?? "this person"}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed whitespace-pre-wrap text-zinc-700">{memories[current.visitorId]}</p>
                </div>
              )}
              {current?.messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end gap-2.5">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white px-4 py-2.5 text-sm whitespace-pre-wrap shadow-soft">{m.content}</div>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-zinc-200 text-zinc-500">
                      <UserRound className="size-3.5" />
                    </span>
                  </div>
                ) : (
                  <div key={i} className="flex gap-2.5">
                    <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={28} />
                    <div className="min-w-0 flex-1 text-sm">
                      <div className={cn(m.rating === "down" && !m.correction && "rounded-xl ring-2 ring-amber-200 ring-offset-4 ring-offset-zinc-50")}>
                        <Markdown text={m.content} />
                      </div>
                      {m.correction && editing !== i && (
                        <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                            <Check className="size-3.5" /> Your improved answer — your mind has learned this
                          </div>
                          <div className="mt-1.5">
                            <Markdown text={m.correction} />
                          </div>
                        </div>
                      )}
                      {editing === i ? (
                        <div className="mt-2 space-y-2">
                          <Textarea rows={6} value={draft} onChange={(e) => setDraft(e.target.value)} />
                          <div className="flex gap-2">
                            <Button size="sm" loading={saving} disabled={!draft.trim()} onClick={() => saveCorrection(i)}>
                              Teach my mind
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                          {m.rating === "up" && (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <ThumbsUp className="size-3.5 fill-current" /> Helpful
                            </span>
                          )}
                          {m.rating === "down" && (
                            <span className="inline-flex items-center gap-1 text-rose-600">
                              <ThumbsDown className="size-3.5 fill-current" /> Not helpful
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setEditing(i);
                              setDraft(m.correction ?? m.content);
                            }}
                            className="inline-flex items-center gap-1 font-medium text-violet-700 hover:underline"
                          >
                            <PencilLine className="size-3.5" /> {m.correction ? "Edit improved answer" : "Improve this answer"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </Card>

          {stats.questions.length > 0 && (
            <div className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-soft">
              <div className="text-sm font-semibold">Recent opening questions</div>
              <p className="text-xs text-muted">What people come to your mind with — great ideas for content and offers.</p>
              <ul className="mt-3 space-y-1.5">
                {stats.questions.map(({ c, q }) => (
                  <li key={c.id} className="truncate text-sm text-zinc-700">
                    “{q!.content.slice(0, 140)}”
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}
