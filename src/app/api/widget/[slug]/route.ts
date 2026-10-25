import { read } from "@/lib/db";

const cors = { "access-control-allow-origin": "*", "cache-control": "public, max-age=300" };

/** Public look-and-feel for the website widget. Only data already shown on the public chat page. */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await read();
  const bot = d.bots.find((b) => b.slug === slug && b.published);
  const owner = bot && d.coaches.find((c) => c.id === bot.coachId);
  if (!bot || owner?.status !== "active") return Response.json({ error: "Not found" }, { status: 404, headers: cors });
  return Response.json({ name: bot.name, color: bot.brandColor, emoji: bot.avatarEmoji, image: bot.avatarImage, greeting: bot.welcomeMessage }, { headers: cors });
}

export function OPTIONS() {
  return new Response(null, { headers: { ...cors, "access-control-allow-methods": "GET" } });
}
