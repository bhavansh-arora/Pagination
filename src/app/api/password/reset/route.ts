import { z } from "zod";
import { hashPassword, sha256 } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { clientIp, fail, json, rateLimit } from "@/lib/api";

const Body = z.object({ token: z.string().min(20).max(200), password: z.string().min(8, "Password must be at least 8 characters").max(200) });

export async function POST(req: Request) {
  if (!rateLimit(`reset:${clientIp(req)}`, 20, 3600_000)) return fail("Too many attempts, try again later", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid request");
  const passwordHash = await hashPassword(parsed.data.password);
  const h = sha256(parsed.data.token);
  const kind = await mutate((d) => {
    const t = d.resetTokens.find((x) => x.tokenHash === h);
    if (!t || new Date(t.expiresAt).getTime() < Date.now()) return null;
    d.resetTokens = d.resetTokens.filter((x) => x.tokenHash !== h);
    if (t.kind === "coach") {
      const c = d.coaches.find((x) => x.id === t.userId);
      if (!c) return null;
      c.passwordHash = passwordHash;
      d.sessions = d.sessions.filter((s) => s.coachId !== c.id);
    } else {
      const c = d.clients.find((x) => x.id === t.userId);
      if (!c) return null;
      c.passwordHash = passwordHash;
      d.clientSessions = d.clientSessions.filter((s) => s.clientId !== c.id);
    }
    return t.kind;
  });
  if (!kind) return fail("This reset link is invalid or has expired. Request a new one.", 400);
  return json({ ok: true, kind });
}
