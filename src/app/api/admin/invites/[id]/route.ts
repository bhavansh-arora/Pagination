import { mutate } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/admin";
import { fail, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const removed = await mutate((d) => {
    const i = d.invites.find((x) => x.id === id);
    d.invites = d.invites.filter((x) => x.id !== id);
    return i;
  });
  if (!removed) return fail("Not found", 404);
  await audit(admin, "Revoked invite", removed.email || removed.note || "open invite");
  return json({ ok: true });
}
