import { z } from "zod";
import { createCoach, startSession } from "@/lib/auth";
import { clientIp, fail, json, rateLimit } from "@/lib/api";

const Body = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function POST(req: Request) {
  if (!rateLimit(`signup:${clientIp(req)}`, 10, 3600_000)) return fail("Too many attempts, try later", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid details");
  const coach = await createCoach(parsed.data.name, parsed.data.email, parsed.data.password);
  if (!coach) return fail("An account with that email already exists", 409);
  await startSession(coach.id);
  return json({ ok: true });
}
