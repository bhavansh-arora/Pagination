import { hashPassword, randomPassword } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/admin";
import { fail, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const password = randomPassword();
  const passwordHash = await hashPassword(password);
  const email = await mutate((d) => {
    const c = d.coaches.find((x) => x.id === id);
    if (!c) return null;
    c.passwordHash = passwordHash;
    d.sessions = d.sessions.filter((s) => s.coachId !== id);
    return c.email;
  });
  if (!email) return fail("Not found", 404);
  await audit(admin, "Reset password", email);
  return json({ password });
}
