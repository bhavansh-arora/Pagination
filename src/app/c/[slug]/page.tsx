import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatView } from "@/components/chat/ChatView";
import { getCoach } from "@/lib/auth";
import { publicBot } from "@/lib/bots";
import { read } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const bot = (await read()).bots.find((b) => b.slug === slug);
  if (!bot) return null;
  if (bot.published) return { bot, draft: false };
  const coach = await getCoach();
  return coach?.id === bot.coachId ? { bot, draft: true } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await load((await params).slug);
  if (!r) return { title: "Not found" };
  return {
    title: { absolute: `${r.bot.name} — by ${r.bot.coachName}` },
    description: r.bot.tagline || `Chat with ${r.bot.coachName}'s AI mind.`,
    robots: r.bot.visibility === "code" ? { index: false } : undefined,
  };
}

export default async function PublicChat({ params }: Props) {
  const r = await load((await params).slug);
  if (!r) notFound();
  return (
    <div className="flex h-dvh flex-col">
      {r.draft && (
        <div className="shrink-0 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800">
          Only you can see this — publish the mind from your dashboard to share it.
        </div>
      )}
      <div className="min-h-0 flex-1">
        <ChatView bot={publicBot(r.bot)} mode="public" />
      </div>
    </div>
  );
}
