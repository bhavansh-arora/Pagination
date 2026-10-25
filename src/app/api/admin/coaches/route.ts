import { z } from "zod";
import { createCoach, randomPassword } from "@/lib/auth";
import { audit, requireAdmin } from "@/lib/admin";
import { fail, json } from "@/lib/api";

const Body = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().max(200).optional(),
  role: z.enum(["admin", "coach"]).default("coach"),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid details");
  const { name, email, role } = parsed.data;
  const password = parsed.data.password?.trim() || randomPassword();
  if (password.length < 8) return fail("Password must be at least 8 characters");
  const coach = await createCoach(name, email, password, role);
  if (!coach) return fail("An account with that email already exists", 409);
  await audit(admin, role === "admin" ? "Created admin" : "Created coach", email);
  return json({ coach: { id: coach.id, email }, password }, 201);
}
