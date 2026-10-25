import { z } from "zod";
import { currentSessionHash, getCoach, hashPassword, verifyPassword } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { fail, json } from "@/lib/api";

const Body = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().toLowerCase().email().max(200).optional(),
  currentPassword: z.string().max(200).optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(200).optional(),
});

export async function PATCH(req: Request) {
  const coach = await getCoach();
  if (!coach) return fail("Please sign in", 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid details");
  const { name, email, currentPassword, newPassword } = parsed.data;

  const sensitive = (email && email !== coach.email) || newPassword;
  if (sensitive && !(await verifyPassword(currentPassword ?? "", coach.passwordHash))) {
    return fail("Your current password is incorrect", 401);
  }
  const passwordHash = newPassword ? await hashPassword(newPassword) : undefined;
  const keep = await currentSessionHash();

  const result = await mutate((d) => {
    const c = d.coaches.find((x) => x.id === coach.id)!;
    if (email && email !== c.email && d.coaches.some((x) => x.email === email)) return "That email is already in use";
    if (name) c.name = name;
    if (email) c.email = email;
    if (passwordHash) {
      c.passwordHash = passwordHash;
      d.sessions = d.sessions.filter((s) => s.coachId !== c.id || s.tokenHash === keep);
    }
    return null;
  });
  if (result) return fail(result, 409);
  return json({ ok: true });
}
