import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatView } from "@/components/chat/ChatView";
import { getCoach } from "@/lib/auth";
import { publicBot } from "@/lib/bots";
import { read } from "@/lib/db";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ embed?: string }> };

async function load(slug: string) {
  const d = await read();
  const bot = d.bots.find((b) => b.slug === slug);
  if (!bot) return null;
  const coach = await getCoach();
  const canManage = !!coach && (coach.id === bot.coachId || coach.role === "admin");
  if (d.coaches.find((c) => c.id === bot.coachId)?.status !== "active" && coach?.role !== "admin") return null;
  if (bot.published) return { bot, draft: false };
  return canManage ? { bot, draft: true } : null;
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

export default async function PublicChat({ params, searchParams }: Props) {
  const r = await load((await params).slug);
  if (!r) notFound();
  const embedded = (await searchParams).embed === "1";
  return (
    <div className="flex h-dvh flex-col">
      {r.draft && !embedded && (
        <div className="shrink-0 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800">
          Only you can see this — publish the mind from your dashboard to share it.
        </div>
      )}
      <div className="min-h-0 flex-1">
        <ChatView bot={publicBot(r.bot)} mode="public" embedded={embedded} />
      </div>
    </div>
  );
}
