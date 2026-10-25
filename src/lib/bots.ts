import "server-only";
import { customAlphabet, nanoid } from "nanoid";
import { DEFAULT_PRICING, type Bot } from "./db";
import { DEFAULT_MODEL } from "./models";

const suffix = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 5);

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "mind"
  );
}

export function uniqueSlug(base: string, taken: Set<string>) {
  let slug = slugify(base);
  while (taken.has(slug)) slug = `${slugify(base)}-${suffix()}`;
  return slug;
}

export function newBot(coachId: string, coachName: string, name: string, emoji: string, taken: Set<string>): Bot {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    coachId,
    slug: uniqueSlug(name, taken),
    name,
    coachName,
    tagline: "",
    avatarEmoji: emoji || "✨",
    avatarImage: null,
    brandColor: "#7c3aed",
    bio: "",
    philosophy: "",
    instructions: "",
    tones: ["warm", "direct"],
    responseLength: "balanced",
    boundaries: "",
    welcomeMessage: `Hey, I'm ${coachName.split(" ")[0] || "your coach"}'s AI. Tell me what's on your mind and let's work through it together.`,
    starters: [],
    ctaLabel: "",
    ctaUrl: "",
    model: DEFAULT_MODEL,
    depth: "balanced",
    visibility: "public",
    accessCode: "",
    published: false,
    pricing: { ...DEFAULT_PRICING, packs: [] },
    memoryEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

/** Fields that are safe to expose to anyone who can open the public chat. */
export function publicBot(bot: Bot) {
  return {
    slug: bot.slug,
    name: bot.name,
    coachName: bot.coachName,
    tagline: bot.tagline,
    avatarEmoji: bot.avatarEmoji,
    avatarImage: bot.avatarImage,
    brandColor: bot.brandColor,
    welcomeMessage: bot.welcomeMessage,
    starters: bot.starters.filter(Boolean),
    ctaLabel: bot.ctaLabel,
    ctaUrl: bot.ctaUrl,
    needsCode: bot.visibility === "code",
    paid: bot.pricing.mode === "paid",
  };
}

export type PublicBot = ReturnType<typeof publicBot>;
