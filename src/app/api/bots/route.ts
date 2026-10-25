import { z } from "zod";
import { mutate, read } from "@/lib/db";
import { newBot } from "@/lib/bots";
import { fail, json, requireCoach } from "@/lib/api";

export async function GET() {
  const coach = await requireCoach();
  if (coach instanceof Response) return coach;
  const d = await read();
  const bots = d.bots
    .filter((b) => b.coachId === coach.id)
    .map((b) => ({
      ...b,
      sourceCount: d.sources.filter((s) => s.botId === b.id).length,
      conversationCount: d.conversations.filter((c) => c.botId === b.id && !c.preview).length,
    }));
  return json({ bots });
}

const Body = z.object({ name: z.string().trim().min(1).max(60), emoji: z.string().max(16).optional() });

export async function POST(req: Request) {
  const coach = await requireCoach();
  if (coach instanceof Response) return coach;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Give your mind a name");
  const bot = await mutate((d) => {
    const b = newBot(coach.id, coach.name, parsed.data.name, parsed.data.emoji ?? "✨", new Set(d.bots.map((x) => x.slug)));
    d.bots.push(b);
    return b;
  });
  return json({ bot }, 201);
}
