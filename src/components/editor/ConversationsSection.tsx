"use client";
import { useEffect, useState } from "react";
import { Loader2, MessagesSquare, UserRound } from "lucide-react";
import type { Bot, Conversation } from "@/lib/db";
import { cn } from "@/lib/cn";
import { BotAvatar } from "../brand";
import { Card } from "../ui";
import { Markdown } from "../chat/Markdown";
import { PageTitle } from "./sections";

export function ConversationsSection({ bot, initialCount }: { bot: Bot; initialCount: number }) {
  const [list, setList] = useState<Conversation[] | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bots/${bot.id}/conversations`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.conversations ?? []);
        setActive(d.conversations?.[0]?.id ?? null);
      });
  }, [bot.id]);

  const current = list?.find((c) => c.id === active);
  const clients = new Set(list?.map((c) => c.visitorId)).size;
  const questions = list?.reduce((n, c) => n + c.messages.filter((m) => m.role === "user").length, 0) ?? 0;

  return (
    <>
      <PageTitle title="Conversations" subtitle="See what clients ask your mind. Spot patterns, improve answers, and find ideas for new content." />
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
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              ["Conversations", list.length],
              ["Unique visitors", clients],
              ["Questions asked", questions],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-line bg-white p-4 shadow-soft">
                <div className="text-xs font-semibold text-muted">{l}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{v}</div>
              </div>
            ))}
          </div>
          <Card className="grid h-[620px] overflow-hidden md:grid-cols-[240px_1fr]">
            <ul className="scrollbar-thin overflow-y-auto border-b border-line md:border-r md:border-b-0">
              {list.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setActive(c.id)}
                    className={cn("w-full border-b border-line/60 px-4 py-3 text-left transition", c.id === active ? "bg-violet-50/70" : "hover:bg-zinc-50")}
                  >
                    <div className="truncate text-sm font-medium">{c.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      {c.messages.length} messages · {new Date(c.updatedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="scrollbar-thin space-y-5 overflow-y-auto bg-zinc-50/40 p-5">
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
                      <Markdown text={m.content} />
                    </div>
                  </div>
                ),
              )}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
