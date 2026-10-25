import { z } from "zod";
import { createCoach, startSession } from "@/lib/auth";
import { mutate, read } from "@/lib/db";
import { clientIp, fail, json, rateLimit } from "@/lib/api";

const Body = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  invite: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`signup:${clientIp(req)}`, 10, 3600_000)) return fail("Too many attempts, try later", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid details");
  const { name, email, password, invite: token } = parsed.data;

  const d = await read();
  const invite = token ? d.invites.find((i) => i.token === token) : undefined;
  if (token && (!invite || invite.usedAt || new Date(invite.expiresAt).getTime() < Date.now())) {
    return fail("This invite link is invalid or has expired. Ask for a new one.", 403);
  }
  if (invite?.email && invite.email !== email) return fail(`This invite is for ${invite.email}`, 403);
  if (!invite && d.settings.signupMode !== "open") return fail("Sign-ups are invite-only. Ask the administrator for an invite link.", 403);

  const coach = await createCoach(name, email, password);
  if (!coach) return fail("An account with that email already exists", 409);
  if (invite) {
    await mutate((data) => {
      const i = data.invites.find((x) => x.id === invite.id);
      if (i) Object.assign(i, { usedAt: new Date().toISOString(), usedBy: coach.id });
    });
  }
  await startSession(coach.id);
  return json({ ok: true, redirect: "/dashboard" });
}
