import { nanoid } from "nanoid";
import { z } from "zod";
import { mutate } from "@/lib/db";
import { clientIp, fail, json, rateLimit } from "@/lib/api";
import { adminEmails, sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/stripe";

const Body = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  niche: z.string().trim().min(1, "What do you coach?").max(120),
  audience: z.string().trim().max(60).default(""),
  website: z.string().trim().max(300).default(""),
  message: z.string().trim().max(2000).default(""),
});

export async function POST(req: Request) {
  if (!rateLimit(`apply:${clientIp(req)}`, 5, 3600_000)) return fail("Too many applications from this network, try later", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form");
  const result = await mutate((d) => {
    if (d.coaches.some((c) => c.email === parsed.data.email)) return "exists";
    if (d.applications.some((a) => a.email === parsed.data.email && a.status === "new")) return "pending";
    d.applications.push({ id: nanoid(10), ...parsed.data, status: "new", createdAt: new Date().toISOString() });
    return "ok";
  });
  if (result === "exists") return fail("You already have an account — sign in instead", 409);
  if (result === "ok") {
    const base = await appUrl();
    // Don't make the applicant wait on the mail server.
    void Promise.all([
      sendMail(await adminEmails(), {
        subject: `New coach application: ${parsed.data.name}`,
        heading: "New coach application",
        paragraphs: [`${parsed.data.name} (${parsed.data.email}) applied.`, `Coaches: ${parsed.data.niche}`, ...(parsed.data.audience ? [`Audience: ${parsed.data.audience}`] : [])],
        button: { label: "Review application", url: `${base}/admin/onboarding` },
      }),
      sendMail(parsed.data.email, {
        subject: "We got your application",
        heading: `Thanks, ${parsed.data.name.split(" ")[0]}!`,
        paragraphs: ["We've received your application and will review it shortly. Once you're approved, we'll email you a personal link to create your account."],
      }),
    ]);
  }
  return json({ ok: true });
}
