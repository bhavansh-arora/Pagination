import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { read } from "@/lib/db";
import { INTERVIEW_QUESTIONS } from "@/lib/interview";
import { TONES } from "@/lib/models";
import { quotaFor } from "@/lib/quota";
import { recordUsage } from "@/lib/usage";
import { fail, json, ownedBot, rateLimit } from "@/lib/api";

export const maxDuration = 300;
type Ctx = { params: Promise<{ id: string }> };

const MODEL = "claude-opus-5-5";

const Body = z.object({ answers: z.record(z.string(), z.string().max(6000)) });

const Draft = z.object({
  tagline: z.string().describe("One line: who this mind helps and with what. Under 120 characters."),
  bio: z.string().describe("First-person 'about me' in the coach's voice, 80-180 words."),
  philosophy: z.string().describe("Core beliefs and the signature framework as a short bulleted list, using the coach's own names for things."),
  instructions: z.string().describe("5-10 bullet points ('- ...') on how to coach in a conversation, drawn from how the coach works."),
  boundaries: z.string().describe("Topics to avoid or hand back to the coach. Empty string if none were given."),
  welcomeMessage: z.string().describe("First message clients see, in the coach's voice, 1-2 sentences."),
  starters: z.array(z.string()).describe("Exactly 4 short conversation starters written as the client would type them."),
  tones: z.array(z.enum(TONES.map((t) => t.id) as [string, ...string[]])).describe("2-3 tones that best fit the coach's voice."),
  responseLength: z.enum(["concise", "balanced", "detailed"]),
  ctaLabel: z.string().describe("Button label for working with the coach, or empty string."),
  ctaUrl: z.string().describe("URL for working with the coach exactly as given (add https:// if missing), or empty string."),
  knowledgeNote: z
    .string()
    .describe("A thorough write-up of the method/framework and the common client problems with how the coach responds, as reference material. Markdown headings allowed."),
});

const g = globalThis as unknown as { __client?: Anthropic };

export async function POST(req: Request, { params }: Ctx) {
  const r = await ownedBot((await params).id);
  if (r instanceof Response) return r;
  if (!rateLimit(`interview:${r.coach.id}`, 6, 3600_000)) return fail("You've drafted a few times already — try again in a bit.", 429);
  const d = await read();
  const owner = d.coaches.find((c) => c.id === r.bot.coachId);
  if (owner && quotaFor(d, owner).exceeded) return fail("You've used this month's AI replies on your plan. Upgrade to keep going.", 429);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Answer at least a few questions first");
  const qa = INTERVIEW_QUESTIONS.map((q) => ({ q: q.q, a: (parsed.data.answers[q.id] ?? "").trim() })).filter((x) => x.a);
  if (qa.length < 3) return fail("Answer at least 3 questions so the draft sounds like you");

  const transcript = qa.map((x) => `Q: ${x.q}\nA: ${x.a}`).join("\n\n");
  const client = (g.__client ??= new Anthropic());
  try {
    const res = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium", format: betaZodOutputFormat(Draft) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system:
        "You help a coach set up an AI version of themselves that their clients will chat with. From the coach's interview answers, draft the AI's profile. Write everything in the coach's own voice and vocabulary — reuse their phrases and framework names, don't invent credentials, results, prices or stories they didn't mention, and leave fields empty rather than guessing.",
      messages: [{ role: "user", content: `Coach name: ${r.bot.coachName || "the coach"}\n\nInterview:\n\n${transcript}` }],
    });
    recordUsage(r.bot.id, r.bot.coachId, res.model || MODEL, res.usage, true).catch(() => undefined);
    if (res.stop_reason === "refusal" || !res.parsed_output) return fail("Couldn't draft from those answers — try rephrasing a few of them.", 422);
    const draft = res.parsed_output;
    return json({ draft: { ...draft, starters: draft.starters.slice(0, 4).map((s) => s.slice(0, 140)), ctaUrl: /^https?:\/\//.test(draft.ctaUrl) || !draft.ctaUrl ? draft.ctaUrl : `https://${draft.ctaUrl}` } });
  } catch (err) {
    console.error("[interview]", err);
    if (err instanceof Anthropic.AuthenticationError) return fail("The AI isn't connected yet (missing API key).", 503);
    if (err instanceof Anthropic.RateLimitError) return fail("The AI is busy — try again in a minute.", 429);
    return fail("Something went wrong drafting your mind. Please try again.", 502);
  }
}
