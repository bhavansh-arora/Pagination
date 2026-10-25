import { z } from "zod";
import { mutate } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/admin";
import { fail, json } from "@/lib/api";

const Patch = z
  .object({
    signupMode: z.enum(["open", "invite", "closed"]),
    maxMindsPerCoach: z.number().int().min(0).max(1000),
    visitorMessagesPer10Min: z.number().int().min(1).max(10_000),
  })
  .partial()
  .strict();

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid settings");
  const settings = await mutate((d) => Object.assign(d.settings, parsed.data));
  await audit(admin, "Changed settings", Object.entries(parsed.data).map(([k, v]) => `${k}=${v}`).join(", "));
  return json({ settings });
}
