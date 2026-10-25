import "server-only";
import { nanoid } from "nanoid";
import { getAdmin } from "./auth";
import { mutate, type Coach } from "./db";
import { fail } from "./api";

export async function requireAdmin(): Promise<Coach | Response> {
  return (await getAdmin()) ?? fail("Admins only", 403);
}

export async function audit(actor: Coach, action: string, target: string) {
  await mutate((d) => {
    d.audit.push({ id: nanoid(10), at: new Date().toISOString(), actorId: actor.id, actorEmail: actor.email, action, target });
    if (d.audit.length > 1000) d.audit = d.audit.slice(-1000);
  });
}
