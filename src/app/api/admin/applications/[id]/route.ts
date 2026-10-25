import crypto from "node:crypto";
import { nanoid } from "nanoid";
import { z } from "zod";
import { mutate } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/admin";
import { fail, json } from "@/lib/api";
import { sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/stripe";

type Ctx = { params: Promise<{ id: string }> };
const Body = z.object({ action: z.enum(["approve", "reject"]) });

/** Approving creates a 14-day invite locked to the applicant's email. */
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Choose approve or reject");
  const result = await mutate((d) => {
    const app = d.applications.find((a) => a.id === id);
    if (!app) return null;
    if (parsed.data.action === "reject") {
      app.status = "rejected";
      return { app, token: null };
    }
    let invite = app.inviteId ? d.invites.find((i) => i.id === app.inviteId && !i.usedAt) : undefined;
    if (!invite) {
      invite = {
        id: nanoid(10),
        token: crypto.randomBytes(24).toString("base64url"),
        email: app.email,
        note: `Application: ${app.niche}`,
        createdBy: admin.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 14 * 86400_000).toISOString(),
      };
      d.invites.push(invite);
    }
    app.status = "approved";
    app.inviteId = invite.id;
    return { app, token: invite.token };
  });
  if (!result) return fail("Not found", 404);
  await audit(admin, parsed.data.action === "approve" ? "Approved application" : "Rejected application", result.app.email);
  let emailed = false;
  if (result.token) {
    emailed = await sendMail(result.app.email, {
      subject: "You're in — create your account",
      heading: `Welcome aboard, ${result.app.name.split(" ")[0]}!`,
      paragraphs: [
        "Your application has been approved. Use your personal link below to create your account and start building your AI mind.",
        "Setup takes about 20 minutes: add your content, describe how you coach, test it, then share your link.",
      ],
      button: { label: "Create my account", url: `${await appUrl()}/signup?invite=${result.token}` },
      footnote: "This link is just for you and expires in 14 days.",
    });
  }
  return json({ ok: true, token: result.token, emailed });
}
