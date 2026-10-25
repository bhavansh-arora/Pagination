import crypto from "node:crypto";
import { z } from "zod";
import { sha256 } from "@/lib/auth";
import { mutate, read } from "@/lib/db";
import { mailEnabled, sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/stripe";
import { clientIp, fail, json, rateLimit } from "@/lib/api";

const Body = z.object({ email: z.string().trim().toLowerCase().email(), kind: z.enum(["coach", "client"]) });

/** Always answers the same way so it can't be used to discover which emails have accounts. */
export async function POST(req: Request) {
  if (!rateLimit(`forgot:${clientIp(req)}`, 8, 3600_000)) return fail("Too many requests, try again later", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Enter a valid email");
  if (!mailEnabled()) return fail("Email isn't set up on this platform. Ask the administrator to reset your password.", 503);
  const { email, kind } = parsed.data;
  const d = await read();
  const user = kind === "coach" ? d.coaches.find((c) => c.email === email && c.status === "active") : d.clients.find((c) => c.email === email);
  if (user && rateLimit(`forgot-user:${user.id}`, 3, 3600_000)) {
    const token = crypto.randomBytes(32).toString("base64url");
    await mutate((data) => {
      const now = Date.now();
      data.resetTokens = data.resetTokens.filter((t) => new Date(t.expiresAt).getTime() > now && t.userId !== user.id);
      data.resetTokens.push({ tokenHash: sha256(token), kind, userId: user.id, expiresAt: new Date(now + 3600_000).toISOString() });
    });
    await sendMail(email, {
      subject: "Reset your password",
      heading: "Reset your password",
      paragraphs: [`Hi ${user.name.split(" ")[0]}, we got a request to reset your password.`, "This link works once and expires in 1 hour."],
      button: { label: "Choose a new password", url: `${await appUrl()}/reset?token=${token}` },
      footnote: "If you didn't ask for this, you can ignore this email — your password won't change.",
    });
  }
  return json({ ok: true });
}
