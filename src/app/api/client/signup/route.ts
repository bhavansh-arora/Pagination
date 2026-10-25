import { z } from "zod";
import { createClient, startClientSession } from "@/lib/client-auth";
import { clientIp, fail, json, rateLimit } from "@/lib/api";

const Body = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  visitorId: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`client-signup:${clientIp(req)}`, 15, 3600_000)) return fail("Too many attempts, try later", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid details");
  const client = await createClient(parsed.data.name, parsed.data.email, parsed.data.password);
  if (!client) return fail("You already have an account — sign in instead", 409);
  await startClientSession(client.id, parsed.data.visitorId);
  return json({ ok: true, client: { name: client.name, email: client.email } });
}
