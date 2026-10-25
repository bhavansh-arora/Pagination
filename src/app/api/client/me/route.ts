import { z } from "zod";
import { getClient } from "@/lib/client-auth";
import { mutate } from "@/lib/db";
import { fail, json } from "@/lib/api";

export async function GET() {
  const client = await getClient();
  return json({ client: client ? { name: client.name, email: client.email } : null });
}

const Patch = z.object({ name: z.string().trim().min(1).max(80) });

export async function PATCH(req: Request) {
  const client = await getClient();
  if (!client) return fail("Please sign in", 401);
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Enter your name");
  await mutate((d) => {
    const c = d.clients.find((x) => x.id === client.id);
    if (c) c.name = parsed.data.name;
  });
  return json({ ok: true });
}
