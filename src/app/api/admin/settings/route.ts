import { z } from "zod";
import { mutate } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/admin";
import { fail, json } from "@/lib/api";

const Patch = z
  .object({
    signupMode: z.enum(["open", "invite", "closed"]),
    defaultPlanId: z.string().max(40),
    platformCurrency: z.string().length(3),
    demoSlug: z.string().max(60),
    aiMonthlyBudget: z.number().int().min(0).max(100_000_000),
    plans: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]{2,30}$/, "Plan ids use lowercase letters, numbers and dashes"),
          name: z.string().trim().min(1).max(40),
          tagline: z.string().max(120),
          priceMonthly: z.number().int().min(0).max(10_000_000),
          commissionPct: z.number().min(0).max(90),
          maxMinds: z.number().int().min(0).max(1000),
          canCharge: z.boolean(),
          highlight: z.boolean(),
          features: z.array(z.string().max(120)).max(12),
        }),
      )
      .min(1)
      .max(6),
    visitorMessagesPer10Min: z.number().int().min(1).max(10_000),
  })
  .partial()
  .strict();

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid settings");
  const { plans } = parsed.data;
  if (plans && new Set(plans.map((p) => p.id)).size !== plans.length) return fail("Each plan needs a unique id");
  const settings = await mutate((d) => {
    const next = { ...d.settings, ...parsed.data };
    if (!next.plans.some((p) => p.id === next.defaultPlanId)) next.defaultPlanId = next.plans.find((p) => p.priceMonthly === 0)?.id ?? next.plans[0].id;
    d.settings = next;
    return next;
  });
  await audit(
    admin,
    plans ? "Changed plans & fees" : "Changed settings",
    Object.entries(parsed.data)
      .map(([k, v]) => (k === "plans" ? `${(v as unknown[]).length} plans` : `${k}=${v}`))
      .join(", "),
  );
  return json({ settings });
}
