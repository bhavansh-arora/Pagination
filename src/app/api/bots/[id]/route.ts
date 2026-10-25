import { z } from "zod";
import { deleteSourceText, mutate } from "@/lib/db";
import { slugify } from "@/lib/bots";
import { MODELS } from "@/lib/models";
import { fail, json, ownedBot } from "@/lib/api";
import { audit } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const r = await ownedBot((await params).id);
  if (r instanceof Response) return r;
  return json({ bot: r.bot });
}

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Links must start with http:// or https://");

const Patch = z
  .object({
    name: z.string().trim().min(1).max(60),
    coachName: z.string().trim().max(80),
    slug: z.string().trim().min(2).max(40),
    tagline: z.string().max(200),
    avatarEmoji: z.string().max(16),
    avatarImage: z
      .string()
      .max(400_000)
      .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)
      .nullable(),
    brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    bio: z.string().max(8000),
    philosophy: z.string().max(8000),
    instructions: z.string().max(20000),
    tones: z.array(z.enum(["warm", "direct", "playful", "calm", "motivational", "analytical", "spiritual", "no-nonsense"])).max(8),
    responseLength: z.enum(["concise", "balanced", "detailed"]),
    boundaries: z.string().max(4000),
    welcomeMessage: z.string().max(1000),
    starters: z.array(z.string().max(140)).max(6),
    ctaLabel: z.string().max(60),
    ctaUrl: httpUrl,
    model: z.enum(MODELS.map((m) => m.id) as [string, ...string[]]),
    depth: z.enum(["fast", "balanced", "deep"]),
    visibility: z.enum(["public", "code"]),
    accessCode: z.string().max(60),
    published: z.boolean(),
  })
  .partial()
  .strict();

export async function PATCH(req: Request, { params }: Ctx) {
  const r = await ownedBot((await params).id);
  if (r instanceof Response) return r;
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid changes");
  const patch = parsed.data;
  const result = await mutate((d) => {
    const bot = d.bots.find((b) => b.id === r.bot.id);
    if (!bot) return { error: "Not found" };
    if (patch.slug !== undefined) {
      const slug = slugify(patch.slug);
      if (d.bots.some((b) => b.slug === slug && b.id !== bot.id)) return { error: "That link is already taken" };
      patch.slug = slug;
    }
    if (patch.visibility === "code" || (patch.visibility === undefined && bot.visibility === "code")) {
      const code = patch.accessCode ?? bot.accessCode;
      if ((patch.published ?? bot.published) && !code.trim()) return { error: "Set an access code before publishing a private mind" };
    }
    Object.assign(bot, patch, { updatedAt: new Date().toISOString() });
    return { bot };
  });
  if ("error" in result) return fail(result.error!);
  if (r.coach.id !== r.bot.coachId) await audit(r.coach, "Edited mind", `${r.bot.name} (${Object.keys(patch).join(", ")})`);
  return json(result);
}

export async function DELETE(_: Request, { params }: Ctx) {
  const r = await ownedBot((await params).id);
  if (r instanceof Response) return r;
  const removed = await mutate((d) => {
    const ids = d.sources.filter((s) => s.botId === r.bot.id).map((s) => s.id);
    d.bots = d.bots.filter((b) => b.id !== r.bot.id);
    d.sources = d.sources.filter((s) => s.botId !== r.bot.id);
    d.conversations = d.conversations.filter((c) => c.botId !== r.bot.id);
    return ids;
  });
  await Promise.all(removed.map(deleteSourceText));
  if (r.coach.id !== r.bot.coachId) await audit(r.coach, "Deleted mind", r.bot.name);
  return json({ ok: true });
}
