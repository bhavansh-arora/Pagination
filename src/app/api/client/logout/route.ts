import { endClientSession } from "@/lib/client-auth";
import { json } from "@/lib/api";

export async function POST() {
  await endClientSession();
  return json({ ok: true });
}
