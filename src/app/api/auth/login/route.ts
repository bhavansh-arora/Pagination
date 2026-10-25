import { z } from "zod";
import { startSession, verifyPassword } from "@/lib/auth";
import { read } from "@/lib/db";
import { clientIp, fail, json, rateLimit } from "@/lib/api";

const Body = z.object({ email: z.string().trim().toLowerCase(), password: z.string() });

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 20, 900_000)) return fail("Too many attempts, try again in a few minutes", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Enter your email and password");
  const coach = (await read()).coaches.find((c) => c.email === parsed.data.email);
  if (!coach || !(await verifyPassword(parsed.data.password, coach.passwordHash))) {
    return fail("Wrong email or password", 401);
  }
  if (coach.status !== "active") return fail("This account is suspended. Contact the administrator.", 403);
  await startSession(coach.id);
  return json({ ok: true, redirect: coach.role === "admin" ? "/admin" : "/dashboard" });
}
