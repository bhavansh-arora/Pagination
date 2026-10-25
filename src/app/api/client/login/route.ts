import { z } from "zod";
import { verifyPassword } from "@/lib/auth";
import { startClientSession } from "@/lib/client-auth";
import { read } from "@/lib/db";
import { clientIp, fail, json, rateLimit } from "@/lib/api";

const Body = z.object({ email: z.string().trim().toLowerCase(), password: z.string(), visitorId: z.string().max(64).optional() });

export async function POST(req: Request) {
  if (!rateLimit(`client-login:${clientIp(req)}`, 20, 900_000)) return fail("Too many attempts, try again in a few minutes", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Enter your email and password");
  const client = (await read()).clients.find((c) => c.email === parsed.data.email);
  if (!client || !(await verifyPassword(parsed.data.password, client.passwordHash))) return fail("Wrong email or password", 401);
  await startClientSession(client.id, parsed.data.visitorId);
  return json({ ok: true, client: { name: client.name, email: client.email } });
}
