import { read } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await read();
    return Response.json({ ok: true, ai: !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
