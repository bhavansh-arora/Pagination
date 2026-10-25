import { z } from "zod";
import { deleteSourceText, mutate } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/admin";
import { fail, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const Patch = z
  .object({
    name: z.string().trim().min(1).max(80),
    email: z.string().trim().toLowerCase().email().max(200),
    role: z.enum(["admin", "coach"]),
    status: z.enum(["active", "suspended"]),
  })
  .partial()
  .strict();

export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid changes");
  const patch = parsed.data;
  if (id === admin.id && (patch.status === "suspended" || patch.role === "coach")) {
    return fail("You can't suspend or demote your own account");
  }
  const result = await mutate((d) => {
    const c = d.coaches.find((x) => x.id === id);
    if (!c) return { error: "Not found", status: 404 };
    if (patch.email && patch.email !== c.email && d.coaches.some((x) => x.email === patch.email)) {
      return { error: "That email is already in use", status: 409 };
    }
    Object.assign(c, patch);
    if (patch.status === "suspended") d.sessions = d.sessions.filter((s) => s.coachId !== c.id);
    return { email: c.email };
  });
  if ("error" in result) return fail(result.error!, result.status);
  const what = [
    patch.status && (patch.status === "suspended" ? "Suspended" : "Reactivated"),
    patch.role && (patch.role === "admin" ? "Made admin" : "Removed admin"),
    (patch.name || patch.email) && "Edited profile",
  ].filter(Boolean);
  await audit(admin, what.join(" · ") || "Updated account", result.email);
  return json({ ok: true });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  if (id === admin.id) return fail("You can't delete your own account");
  const removed = await mutate((d) => {
    const c = d.coaches.find((x) => x.id === id);
    if (!c) return null;
    const botIds = new Set(d.bots.filter((b) => b.coachId === id).map((b) => b.id));
    const sourceIds = d.sources.filter((s) => botIds.has(s.botId)).map((s) => s.id);
    d.coaches = d.coaches.filter((x) => x.id !== id);
    d.sessions = d.sessions.filter((s) => s.coachId !== id);
    d.bots = d.bots.filter((b) => !botIds.has(b.id));
    d.sources = d.sources.filter((s) => !botIds.has(s.botId));
    d.conversations = d.conversations.filter((x) => !botIds.has(x.botId));
    return { email: c.email, sourceIds };
  });
  if (!removed) return fail("Not found", 404);
  await Promise.all(removed.sourceIds.map(deleteSourceText));
  await audit(admin, "Deleted account", removed.email);
  return json({ ok: true });
}
