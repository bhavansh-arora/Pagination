import crypto from "node:crypto";
import { nanoid } from "nanoid";
import { z } from "zod";
import { mutate, type Invite } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/admin";
import { fail, json } from "@/lib/api";

const Body = z.object({
  email: z.union([z.literal(""), z.string().trim().toLowerCase().email().max(200)]).default(""),
  note: z.string().trim().max(200).default(""),
  days: z.number().int().min(1).max(90).default(7),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid invite");
  const invite: Invite = {
    id: nanoid(10),
    token: crypto.randomBytes(24).toString("base64url"),
    email: parsed.data.email,
    note: parsed.data.note,
    createdBy: admin.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + parsed.data.days * 86400_000).toISOString(),
  };
  await mutate((d) => {
    d.invites.push(invite);
  });
  await audit(admin, "Created invite", invite.email || invite.note || "open invite");
  return json({ invite }, 201);
}
