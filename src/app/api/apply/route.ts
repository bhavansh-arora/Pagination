import { nanoid } from "nanoid";
import { z } from "zod";
import { mutate } from "@/lib/db";
import { clientIp, fail, json, rateLimit } from "@/lib/api";

const Body = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  niche: z.string().trim().min(1, "What do you coach?").max(120),
  audience: z.string().trim().max(60).default(""),
  website: z.string().trim().max(300).default(""),
  message: z.string().trim().max(2000).default(""),
});

export async function POST(req: Request) {
  if (!rateLimit(`apply:${clientIp(req)}`, 5, 3600_000)) return fail("Too many applications from this network, try later", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form");
  const result = await mutate((d) => {
    if (d.coaches.some((c) => c.email === parsed.data.email)) return "exists";
    if (d.applications.some((a) => a.email === parsed.data.email && a.status === "new")) return "pending";
    d.applications.push({ id: nanoid(10), ...parsed.data, status: "new", createdAt: new Date().toISOString() });
    return "ok";
  });
  if (result === "exists") return fail("You already have an account — sign in instead", 409);
  return json({ ok: true });
}
