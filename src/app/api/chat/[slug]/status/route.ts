import { read } from "@/lib/db";
import { chatAccess, resolveVisitor } from "@/lib/chat-access";
import { getClient } from "@/lib/client-auth";
import { accessState, offer } from "@/lib/entitlements";
import { fail, json } from "@/lib/api";
import { ipHashFor } from "@/lib/iphash";

type Ctx = { params: Promise<{ slug: string }> };

/** What this visitor can do with a mind right now: free, trial left, member, credits. */
export async function GET(req: Request, { params }: Ctx) {
  const access = await chatAccess((await params).slug, req.headers.get("x-access-code"));
  if ("error" in access) return fail(access.error, access.status);
  const visitor = await resolveVisitor(new URL(req.url).searchParams.get("visitorId"));
  if (!visitor) return fail("Invalid visitor");
  const client = await getClient();
  const state = accessState(await read(), access.bot, visitor.clientId, visitor.key, await ipHashFor(req));
  return json({
    state: access.owner ? { ...state, canChat: true, owner: true } : state,
    offer: offer(access.bot),
    client: client ? { name: client.name, email: client.email } : null,
  });
}
