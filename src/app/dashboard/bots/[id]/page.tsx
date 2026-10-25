import { notFound, redirect } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { getCoach } from "@/lib/auth";
import { read } from "@/lib/db";
import { FULL_MEMORY_CHARS } from "@/lib/brain";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const bot = (await read()).bots.find((b) => b.id === id);
  return { title: bot ? `${bot.name} · Studio` : "Studio" };
}

export default async function BotPage({ params }: Props) {
  const coach = await getCoach();
  if (!coach) redirect("/login");
  const { id } = await params;
  const d = await read();
  const bot = d.bots.find((b) => b.id === id && (b.coachId === coach.id || coach.role === "admin"));
  if (!bot) notFound();
  const owner = bot.coachId === coach.id ? null : d.coaches.find((c) => c.id === bot.coachId);
  const sources = d.sources.filter((s) => s.botId === bot.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const conversationCount = d.conversations.filter((c) => c.botId === bot.id && !c.preview).length;
  return <Editor initialBot={bot} initialSources={sources} conversationCount={conversationCount} fullMemoryChars={FULL_MEMORY_CHARS} adminViewing={owner ? { name: owner.name, id: owner.id } : null} />;
}
