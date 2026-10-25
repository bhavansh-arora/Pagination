import Link from "next/link";
import type { Viewport } from "next";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand";
import { EarningsCalculator } from "@/components/site/EarningsCalculator";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getCoach } from "@/lib/auth";
import { read } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";

export const metadata = {
  title: { absolute: "Sagely — Turn your coaching into an AI your clients can talk to 24/7" },
  description:
    "Train an AI on your courses, content and frameworks. It coaches in your voice, around the clock, and you can charge for access with memberships and message packs.",
  openGraph: {
    title: "Sagely — your coaching mind, on call 24/7",
    description: "Train an AI on your content. Clients talk to it like a GPT built from you. You get paid.",
  },
};

export const viewport: Viewport = { themeColor: "#0d0b09" };

const FAQ = [
  {
    q: "Will it really sound like me?",
    a: "It learns from what you give it: your courses, posts, transcripts and notes, plus your philosophy, tone and coaching rules. It uses your frameworks and words, and you can test it in a live playground before anyone else sees it.",
  },
  {
    q: "What happens when it doesn't know something?",
    a: "It answers from sound general expertise in a way consistent with your philosophy, and it never makes up facts about you, like prices, credentials or client stories. You decide what topics it should redirect to you.",
  },
  {
    q: "How do I get paid?",
    a: "You connect a Stripe account in a few minutes. Clients pay you directly by card for memberships or message packs, and Stripe pays out to your bank. The platform fee for your plan is taken automatically.",
  },
  {
    q: "Can I keep it free?",
    a: "Yes. Every mind can be free, paid with a free trial, or private behind an access code for your existing clients. Many coaches use a free mind to generate leads and a paid one for members.",
  },
  {
    q: "Is it safe for my clients?",
    a: "Guardrails are always on: it's honest about being an AI, points people to professionals for medical, legal and financial decisions, and responds to crisis situations with care. You can add your own boundaries too.",
  },
  {
    q: "Do I need any technical skills?",
    a: "No. If you can upload a PDF and paste a link, you can build your mind. You get a shareable link and a one-line embed for your website.",
  },
];

const MINDS = [
  { emoji: "🌿", name: ["Clarity", "Coach"], kind: "Life coaching", q: "I keep starting things and never finishing.", from: "#3c4a2f", to: "#1b2016" },
  { emoji: "🏋️", name: ["Fit in", "15"], kind: "Fitness", q: "Hotel gym, 20 minutes. What should I do?", from: "#5a3a26", to: "#21160f" },
  { emoji: "🚀", name: ["Founder", "Hours"], kind: "Business", q: "How do I price my first offer?", from: "#2c3550", to: "#13161f" },
  { emoji: "🌙", name: ["Mindful", "Parent"], kind: "Parenting", q: "Bedtime turns into a battle every night.", from: "#43304d", to: "#1a141e" },
  { emoji: "🎤", name: ["Speak with", "Ease"], kind: "Public speaking", q: "Big pitch tomorrow and I'm spiraling.", from: "#53402a", to: "#211a11" },
];

export default async function Home() {
  const coach = await getCoach();
  const d = await read();
  const open = d.settings.signupMode === "open";
  const startHref = coach ? "/dashboard" : open ? "/signup" : "/apply";
  const startLabel = coach ? "Open your studio" : open ? "Start free" : "Apply for access";
  const demo = d.settings.demoSlug && d.bots.some((b) => b.slug === d.settings.demoSlug && b.published) ? `/c/${d.settings.demoSlug}` : null;
  const cur = d.settings.platformCurrency;
  const plans = d.settings.plans;
  const lowestFee = Math.min(...plans.map((p) => p.commissionPct));

  return (
    <div id="top" className="site grain min-h-dvh overflow-x-clip font-display">
      <SiteHeader cta={{ href: startHref, label: startLabel }} signedIn={!!coach} />

      {/* HERO */}
      <section className="p-2.5 sm:p-3.5">
        <div className="relative isolate flex min-h-[max(660px,calc(100svh-20px))] flex-col overflow-hidden rounded-[22px] bg-night-2 sm:min-h-[720px] sm:rounded-[30px] lg:h-[100svh] lg:max-h-[980px]">
          <HeroArt />
          <div className="h-24 shrink-0 sm:h-28" />

          <LiveCard href={demo ?? "#minds"} />

          <div className="mt-auto px-5 pb-6 sm:px-10 sm:pb-10">
            <div className="eyebrow flex items-center gap-2">
              <span className="pulse-dot size-1.5 rounded-full bg-gold" /> AI minds for coaches · creators · experts
            </div>
            <h1 className="mt-5 text-[17vw] leading-[0.9] font-medium tracking-[-0.06em] sm:text-[104px] lg:text-[148px]">
              Your mind,
              <br />
              <span className="sr-only">on call.</span>
              <span aria-hidden className="inline-block h-[1.2em] overflow-hidden pr-[0.12em] align-top leading-[1.2em]">
                <span className="word-cycle block">
                  {["on call.", "in reach.", "always on.", "on call."].map((w, i) => (
                    <span key={i} className="serif-accent block h-[1.2em] text-[1.06em]">
                      {w}
                    </span>
                  ))}
                </span>
              </span>
            </h1>
            <div className="mt-6 flex flex-col gap-6 border-t border-cream/12 pt-6 md:flex-row md:items-end md:justify-between">
              <p className="max-w-md text-[16px] leading-relaxed text-cream/70 sm:text-[17px]">
                Train an AI on your courses, content and frameworks. Clients talk to it like a personal GPT of you, and you earn from every conversation.
              </p>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <GoldButton href={startHref}>{startLabel}</GoldButton>
                <GhostButton href={demo ?? "#how"}>{demo ? "Try a live demo" : "See how it works"}</GhostButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* (01) THE STUDIO */}
      <section className="mx-auto max-w-[1400px] px-5 pt-20 pb-16 sm:px-10 sm:pt-28">
        <SectionRule n="01" label="The idea" right="Train · Share · Earn" />
        <p className="reveal mt-10 text-[30px] leading-[1.1] font-medium tracking-[-0.04em] text-cream sm:text-[46px] lg:text-[60px]">
          We turn your courses <Pill tone="a">📘</Pill>, podcasts <Pill tone="b">🎙️</Pill> and <span className="serif-accent">hard-won frameworks</span> <Pill tone="c">✦</Pill> into an AI that coaches exactly like you, so every client gets your best advice the moment they need it.
        </p>
        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {["Trained on your content", "Your voice & rules", "Paid through Stripe"].map((t) => (
              <span key={t} className="rounded-full border border-cream/15 px-3.5 py-1.5 text-[13px] text-cream/80">
                {t}
              </span>
            ))}
          </div>
          <UnderlineLink href="#how">See how it works</UnderlineLink>
        </div>
      </section>

      {/* (02) WHAT IT DOES */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-10">
        <SectionRule n="02" label="What it does" right="For you · for clients" />
        <SectionTitle a="One mind," b="every client." sub="Everything you know, available to everyone you coach, in a chat that feels like texting you." />

        <div className="mt-12 grid gap-3 md:grid-cols-2">
          <BigCard n="01" label="For you" a="Trained on" b="you.">
            <div className="absolute inset-x-5 top-5 space-y-2 sm:inset-x-8 sm:top-8">
              {[
                ["📄", "Signature Program Workbook.pdf", "Learned"],
                ["🎙️", "Podcast · 48 episodes", "Learned"],
                ["🔗", "yoursite.com/blog", "Learned"],
                ["✍️", "My coaching philosophy", "Learning…"],
              ].map(([e, t, s], i) => (
                <div
                  key={t}
                  className="flex items-center gap-3 rounded-xl border border-cream/10 bg-night/60 px-3.5 py-2.5 backdrop-blur"
                  style={{ opacity: 1 - i * 0.14, transform: `translateX(${i * 10}px)` }}
                >
                  <span className="text-[16px]">{e}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-cream/85">{t}</span>
                  <span className={cn("font-mono text-[10px] tracking-wider uppercase", s === "Learned" ? "text-gold" : "text-cream/45")}>{s}</span>
                </div>
              ))}
            </div>
          </BigCard>
          <BigCard n="02" label="For your clients" a="Feels like" b="texting you." warm>
            <div className="absolute inset-x-5 top-5 space-y-2.5 text-[13px] sm:inset-x-8 sm:top-8">
              <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-cream px-3.5 py-2 text-night">I keep putting off launching my offer.</div>
              <div className="w-fit max-w-[88%] rounded-2xl rounded-tl-md border border-cream/10 bg-night/70 px-3.5 py-2 leading-relaxed text-cream/90 backdrop-blur">
                Let&apos;s use the <b className="text-gold">Clarity Reset</b> from week 2. What&apos;s the smallest version you could share by Friday?
              </div>
            </div>
          </BigCard>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <StatCard label="Always on" chip="24 / 7" big="2" unit="am answers" body="Clarity before the big meeting, after a hard day, and in every gap between sessions." />
          <div className="reveal flex min-h-[260px] flex-col rounded-[22px] border border-cream/10 bg-night-2 p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <div className="flex -space-x-2.5">
                {["🧑🏽", "👩🏼", "🧔🏻"].map((e) => (
                  <span key={e} className="grid size-11 place-items-center rounded-full border-2 border-night-2 bg-night-3 text-lg">
                    {e}
                  </span>
                ))}
              </div>
              <span className="eyebrow">Memory</span>
            </div>
            <div className="mt-auto pt-8">
              <div className="text-[28px] leading-[1.05] font-medium tracking-[-0.04em] sm:text-[32px]">
                Remembers <span className="serif-accent">every</span> client.
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-cream/60">Goals, context and progress carry over, so nobody has to explain themselves twice.</p>
            </div>
          </div>
          <StatCard label="Setup" big="30" unit="minutes" body="From your first upload to a live, shareable link. No code, no prompts to write." gold href={startHref} />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1.6fr_1fr]">
          <div className="reveal rounded-[22px] border border-cream/10 bg-night-2 p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <span className="font-serif text-6xl leading-none text-gold">&ldquo;</span>
              <span className="eyebrow">Sample reply</span>
            </div>
            <p className="mt-2 max-w-2xl text-[20px] leading-[1.35] tracking-[-0.02em] text-cream/90 sm:text-[24px]">
              That&apos;s the classic shiny-object loop we talk about in module 3. Before we fix it: what were you hoping the <span className="serif-accent">next</span> thing would give
              you that the last one didn&apos;t?
            </p>
            <div className="mt-6 text-[13px] text-cream/50">An example of a mind trained on a coach&apos;s own course material</div>
          </div>
          <div className="reveal flex flex-col rounded-[22px] border border-cream/10 bg-night-2 p-6 sm:p-8">
            <span className="eyebrow">Safe by default</span>
            <ul className="mt-6 space-y-3.5">
              {["Honest about being an AI", "Crisis-aware, always", "Refers medical, legal & money decisions to professionals", "Your own boundaries on top"].map((t) => (
                <li key={t} className="flex gap-3 text-[15px] text-cream/85">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* (03) MINDS */}
      <section id="minds" className="scroll-mt-24 py-16">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-10 lg:grid-cols-[380px_1fr] lg:gap-6 lg:pr-0">
          <div className="lg:pt-6">
            <span className="eyebrow">(03) — Minds you could build</span>
            <h2 className="mt-6 text-[52px] leading-[0.92] font-medium tracking-[-0.055em] sm:text-[72px]">
              Built for
              <br />
              <span className="serif-accent text-[1.06em]">every coach.</span>
            </h2>
            <p className="mt-6 max-w-sm text-[16px] leading-relaxed text-cream/65">
              Life, fitness, business, parenting, speaking. If you can teach it, your mind can coach it. A few examples:
            </p>
            <div className="mt-6">
              <UnderlineLink href={demo ?? startHref}>{demo ? "Talk to a live demo" : "Build yours"}</UnderlineLink>
            </div>
          </div>
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:-mx-10 sm:px-10 lg:mx-0 lg:pl-0">
            {MINDS.map((m, i) => (
              <div key={m.kind} className="w-[78vw] max-w-[340px] shrink-0 snap-start">
                <div
                  className="relative flex aspect-[4/5] flex-col overflow-hidden rounded-[22px] border border-cream/10 p-4"
                  style={{ background: `radial-gradient(120% 80% at 30% 15%, ${m.from}, ${m.to})` }}
                >
                  <span className="w-fit rounded-full bg-night/50 px-3 py-1 text-[12px] text-cream/85 backdrop-blur">{m.kind}</span>
                  <div className="grid flex-1 place-items-center text-[88px] drop-shadow-[0_20px_30px_rgb(0_0_0/0.45)]">{m.emoji}</div>
                  <div className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-cream px-3.5 py-2 text-[13px] text-night">{m.q}</div>
                  <div className="mt-2 flex w-fit items-center gap-1.5 rounded-2xl rounded-tl-md bg-night/60 px-3.5 py-2.5 backdrop-blur">
                    {[0, 1, 2].map((k) => (
                      <span key={k} className="pulse-dot size-1.5 rounded-full bg-cream/70" style={{ animationDelay: `${k * 0.2}s` }} />
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between px-1">
                  <div className="text-[24px] font-medium tracking-[-0.04em]">
                    {m.name[0]} <span className="serif-accent">{m.name[1]}</span>
                  </div>
                  <span className="font-mono text-[11px] text-stone">0{i + 1}</span>
                </div>
              </div>
            ))}
            <Link
              href={startHref}
              className="group grid aspect-[4/5] w-[78vw] max-w-[340px] shrink-0 snap-start place-items-center rounded-[22px] border border-dashed border-cream/20 text-center transition hover:border-gold/60"
            >
              <div>
                <span className="mx-auto grid size-20 place-items-center rounded-full bg-gold text-night transition group-hover:scale-105">
                  <ArrowUpRight className="size-6" />
                </span>
                <div className="mt-5 text-[30px] leading-none font-medium tracking-[-0.04em]">
                  Build
                  <br />
                  <span className="serif-accent">yours</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* (04) EARNINGS */}
      <section id="earn" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 py-16 sm:px-10">
        <SectionRule n="04" label="Earnings" right="Memberships · packs · free" />
        <SectionTitle a="Expertise into" b="recurring revenue." sub="Clients pay you directly. Move the sliders to see what you'd keep on each plan." />
        <div className="reveal mt-12">
          <EarningsCalculator
            currency={cur}
            plans={plans.map((p) => ({ id: p.id, name: p.name, priceMonthly: p.priceMonthly, commissionPct: p.commissionPct, highlight: p.highlight }))}
          />
        </div>
      </section>

      {/* (05) HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 py-16 sm:px-10">
        <SectionRule n="05" label="How it works" right="Upload · test · share" />
        <SectionTitle a="Three simple" b="steps." sub="From your first upload to your first paying client, the process is calm, clear and yours." />
        <div className="mt-12 grid gap-3 md:grid-cols-3">
          {[
            {
              when: "Day 1 · 20 min",
              title: "Feed it your mind",
              body: "Upload PDFs, docs and transcripts, paste links to your blog and podcast, or just answer a short interview. Then set your philosophy and voice.",
            },
            {
              when: "Same afternoon",
              title: "Test until it's you",
              body: "Chat with it in a live playground beside every setting. Tweak tone, rules and knowledge until it answers the way you would.",
            },
            {
              when: "Tonight",
              title: "Share it and get paid",
              body: "Publish a beautiful chat link or embed it on your site. Offer a free trial, then memberships or message packs. Payouts go straight to you.",
            },
          ].map((s, i) => (
            <div key={s.title} className="reveal flex flex-col rounded-[22px] border border-cream/10 bg-night-2 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Step 0{i + 1} / 03</span>
                <span className="rounded-full border border-cream/15 px-3 py-1 text-[12px] text-cream/70">{s.when}</span>
              </div>
              <div className="mt-10 font-serif text-[64px] leading-none text-gold italic">0{i + 1}</div>
              <h3 className="mt-4 text-[26px] leading-tight font-medium tracking-[-0.035em]">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-cream/60">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-cream/10 py-6 sm:py-8" aria-hidden>
        <div className="marquee flex w-max">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {["Your voice", "Your frameworks", "Always on", "Trained on you", "Paid monthly", "Private by design"].map((w, i) => (
                <span key={w} className="flex items-center text-[40px] font-medium tracking-[-0.04em] whitespace-nowrap sm:text-[64px]">
                  <span className={cn("px-6 sm:px-10", i % 2 ? "serif-accent" : "text-cream/90")}>{w}</span>
                  <span className="text-[24px] text-gold sm:text-[32px]">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* (06) PRICING */}
      <section id="pricing" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 py-16 sm:px-10 sm:pt-24">
        <SectionRule n="06" label="Pricing" right="Start free · upgrade anytime" />
        <SectionTitle a="Start free." b="Grow into it." sub={`Keep up to ${100 - lowestFee}% of every client payment. Cancel or change plans any time.`} />
        <div className={cn("mt-12 grid gap-3", plans.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
          {plans.map((p) => (
            <div
              key={p.id}
              className={cn("reveal relative flex flex-col rounded-[22px] border p-6 sm:p-8", p.highlight ? "border-gold bg-gold text-night" : "border-cream/10 bg-night-2")}
            >
              <div className="flex items-center justify-between">
                <span className={cn("eyebrow", p.highlight && "text-night/60")}>{p.name}</span>
                {p.highlight && <span className="rounded-full bg-night px-3 py-1 text-[11px] font-medium text-gold">Most popular</span>}
              </div>
              <div className="mt-8 flex items-baseline gap-1.5">
                <span className="text-[56px] leading-none font-medium tracking-[-0.05em]">{p.priceMonthly === 0 ? "Free" : formatMoney(p.priceMonthly, cur)}</span>
                {p.priceMonthly > 0 && <span className={cn("font-serif text-[22px] italic", p.highlight ? "text-night/60" : "text-gold")}>/ month</span>}
              </div>
              <div className={cn("mt-3 min-h-10 text-[14px]", p.highlight ? "text-night/70" : "text-cream/60")}>{p.tagline}</div>
              <div className={cn("mt-5 border-t pt-5 text-[14px]", p.highlight ? "border-night/15" : "border-cream/10")}>
                <div className="font-medium">{p.commissionPct}% fee on client payments</div>
                <div className={p.highlight ? "text-night/60" : "text-cream/50"}>{p.monthlyReplies ? `${p.monthlyReplies.toLocaleString()} AI replies / month` : "Unlimited AI replies"}</div>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className={cn("flex gap-2.5 text-[14px]", p.highlight ? "text-night/85" : "text-cream/80")}>
                    <Check className={cn("mt-0.5 size-4 shrink-0", p.highlight ? "text-night" : "text-gold")} strokeWidth={2.5} /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={startHref}
                className={cn(
                  "mt-8 inline-flex h-12 items-center justify-between rounded-full pr-1.5 pl-6 text-[15px] font-medium transition",
                  p.highlight ? "bg-night text-cream hover:bg-black" : "border border-cream/20 text-cream hover:border-gold hover:text-gold",
                )}
              >
                {coach ? "Choose in your studio" : open ? (p.priceMonthly ? `Start with ${p.name}` : "Start free") : "Apply for access"}
                <span className={cn("grid size-9 place-items-center rounded-full", p.highlight ? "bg-gold text-night" : "bg-cream/10")}>
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[12px] text-cream/40">Card processing fees by Stripe apply.</p>
      </section>

      {/* (07) FAQ */}
      <section id="faq" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 py-16 sm:px-10">
        <SectionRule n="07" label="Questions" right="Straight answers" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <h2 className="text-[48px] leading-[0.95] font-medium tracking-[-0.055em] sm:text-[72px]">
            Questions
            <br />
            <span className="serif-accent text-[1.06em]">coaches ask.</span>
          </h2>
          <div className="border-t border-cream/10">
            {FAQ.map((f, i) => (
              <details key={f.q} className="group border-b border-cream/10 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center gap-4 text-[18px] font-medium tracking-[-0.02em] sm:text-[20px]">
                  <span className="font-mono text-[11px] text-stone">0{i + 1}</span>
                  <span className="flex-1">{f.q}</span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-cream/15 text-lg leading-none text-gold transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl pl-8 text-[15px] leading-relaxed text-cream/65">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA + FOOTER */}
      <section className="p-2.5 pt-16 sm:p-3.5 sm:pt-24">
        <div className="relative overflow-hidden rounded-[22px] border border-cream/10 bg-[radial-gradient(120%_90%_at_80%_0%,#2a2219,#14110d_60%)] px-5 pt-14 pb-8 sm:rounded-[30px] sm:px-14 sm:pt-20">
          <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="eyebrow flex items-center gap-2">
                <span className="pulse-dot size-1.5 rounded-full bg-gold" /> {open ? "Live in under 30 minutes" : "Onboarding a small group each month"}
              </div>
              <h2 className="mt-6 text-[17vw] leading-[0.9] font-medium tracking-[-0.06em] sm:text-[96px] lg:text-[120px]">
                Clone
                <br />
                your <span className="serif-accent text-[1.06em]">mind.</span>
              </h2>
            </div>
            <Link
              href={startHref}
              className="group grid size-40 shrink-0 place-items-center self-start rounded-full bg-gold text-center text-night transition hover:scale-[1.03] sm:size-48 md:self-auto"
            >
              <span className="text-[17px] leading-tight font-medium">
                {startLabel.split(" ").slice(0, -1).join(" ") || startLabel}
                <br />
                {startLabel.split(" ").length > 1 && startLabel.split(" ").slice(-1)}
                <ArrowUpRight className="mx-auto mt-2 size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          </div>

          <footer className="mt-16 grid grid-cols-2 gap-10 border-t border-cream/10 pt-10 sm:mt-20 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="col-span-2 lg:col-span-1">
              <Logo tone="dark" />
              <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-cream/55">
                AI minds for coaches, trained on their own content and available to every client, around the clock.
              </p>
            </div>
            <FooterCol
              title="Explore"
              links={[
                ["#how", "How it works"],
                ["#minds", "Minds"],
                ["#earn", "Earnings"],
                ["#pricing", "Pricing"],
                ["#faq", "FAQ"],
              ]}
            />
            <FooterCol
              title="Account"
              links={[
                [startHref, startLabel],
                ["/login", "Coach sign in"],
                ["/me", "Client account"],
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                ["/legal/terms", "Terms"],
                ["/legal/privacy", "Privacy"],
              ]}
            />
          </footer>
          <div className="mt-12 flex flex-col gap-3 border-t border-cream/10 pt-6 font-mono text-[11px] tracking-[0.12em] text-stone uppercase sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Sagely</span>
            <a href="#top" className="hover:text-cream">
              Back to top ↑
            </a>
          </div>
          <div aria-hidden className="pointer-events-none mt-8 text-center text-[26vw] leading-[0.95] font-medium tracking-[-0.07em] text-cream/[0.05] select-none">
            Sagely
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function GoldButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex h-13 items-center justify-between gap-4 rounded-full bg-gold pr-1.5 pl-6 text-[15px] font-medium text-night transition hover:bg-[#e3c595]">
      {children}
      <span className="grid size-10 place-items-center rounded-full bg-night text-gold transition group-hover:translate-x-0.5">
        <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-13 items-center justify-center rounded-full border border-cream/25 px-6 text-[15px] font-medium text-cream backdrop-blur transition hover:border-cream/60">
      {children}
    </Link>
  );
}

function UnderlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex w-fit items-center gap-3 border-b border-cream/40 pb-1.5 text-[15px] font-medium text-cream transition hover:border-gold hover:text-gold">
      {children} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function SectionRule({ n, label, right }: { n: string; label: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-cream/10 pb-4">
      <span className="eyebrow">
        ({n}) — {label}
      </span>
      <span className="eyebrow hidden sm:block">{right}</span>
    </div>
  );
}

function SectionTitle({ a, b, sub }: { a: string; b: string; sub: string }) {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
      <h2 className="reveal text-[52px] leading-[0.92] font-medium tracking-[-0.055em] sm:text-[80px] lg:text-[96px]">
        {a}
        <br />
        <span className="serif-accent text-[1.06em]">{b}</span>
      </h2>
      <p className="max-w-sm text-[16px] leading-relaxed text-cream/65 md:ml-auto md:pb-3 sm:text-[17px]">{sub}</p>
    </div>
  );
}

function Pill({ tone, children }: { tone: "a" | "b" | "c"; children: React.ReactNode }) {
  const bg = { a: "from-[#3c4a2f] to-[#6b5a35]", b: "from-[#5a3a26] to-[#a07443]", c: "from-[#d6b57f] to-[#8f6c3c]" }[tone];
  return (
    <span className={cn("inline-grid h-[0.78em] w-[1.5em] place-items-center rounded-full bg-gradient-to-r align-[-0.05em] text-[0.42em] shadow-[inset_0_0_0_1px_rgb(243_236_223/0.15)]", bg)}>
      {children}
    </span>
  );
}

function BigCard({ n, label, a, b, warm, children }: { n: string; label: string; a: string; b: string; warm?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "reveal relative flex min-h-[380px] flex-col justify-end overflow-hidden rounded-[22px] border border-cream/10 p-6 sm:min-h-[440px] sm:p-8",
        warm ? "bg-[radial-gradient(90%_70%_at_70%_20%,#4a3520,#16120d)]" : "bg-[radial-gradient(90%_70%_at_30%_20%,#2f3524,#13140f)]",
      )}
    >
      {children}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-night via-night/70 to-transparent" />
      <div className="relative">
        <span className="eyebrow">
          {n} — {label}
        </span>
        <div className="mt-2 text-[40px] leading-none font-medium tracking-[-0.05em] sm:text-[52px]">
          {a} <span className="serif-accent">{b}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, chip, big, unit, body, gold, href }: { label: string; chip?: string; big: string; unit: string; body: string; gold?: boolean; href?: string }) {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span className={cn("eyebrow", gold && "text-night/60")}>{label}</span>
        {chip && <span className="rounded-full border border-cream/15 px-3 py-1 text-[12px] text-cream/75">{chip}</span>}
        {href && (
          <span className="grid size-11 place-items-center rounded-full border border-night/25">
            <ArrowUpRight className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-auto pt-8">
        <div className="flex items-start gap-1.5">
          <span className="text-[84px] leading-[0.85] font-medium tracking-[-0.07em]">{big}</span>
          <span className={cn("font-serif text-[26px] italic", gold ? "text-night/70" : "text-gold")}>{unit}</span>
        </div>
        <p className={cn("mt-4 max-w-xs text-[14px] leading-relaxed", gold ? "text-night/70" : "text-cream/60")}>{body}</p>
      </div>
    </>
  );
  const cls = cn("reveal flex min-h-[260px] flex-col rounded-[22px] border p-6 sm:p-8", gold ? "border-gold bg-gold text-night" : "border-cream/10 bg-night-2");
  return href ? (
    <Link href={href} className={cn(cls, "transition hover:bg-[#e3c595]")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="eyebrow">{title}</div>
      <ul className="mt-4 space-y-2.5">
        {links.map(([href, label]) => (
          <li key={label}>
            <Link href={href} className="text-[15px] text-cream/75 transition hover:text-gold">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroArt() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_78%_32%,rgb(214_181_127/0.22),transparent_70%),radial-gradient(60%_50%_at_10%_100%,rgb(120_80_40/0.25),transparent_70%)]" />
      <div className="absolute top-[42%] left-[71%] size-[880px] -translate-x-1/2 -translate-y-1/2 opacity-80 max-md:top-[25%] max-md:left-[62%] max-md:size-[520px] max-md:opacity-60">
        <svg viewBox="0 0 880 880" className="size-full">
          <defs>
            <radialGradient id="core" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#f0d9ad" stopOpacity=".55" />
              <stop offset="1" stopColor="#f0d9ad" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="440" cy="440" r="150" fill="url(#core)" />
          {[120, 200, 290, 390].map((r, i) => (
            <circle key={r} cx="440" cy="440" r={r} fill="none" stroke="#d6b57f" strokeOpacity={0.28 - i * 0.05} strokeDasharray={i % 2 ? "2 7" : undefined} />
          ))}
          <g className="orbit">
            <circle cx="440" cy="240" r="5" fill="#f0d9ad" />
            <circle cx="150" cy="440" r="3.5" fill="#d6b57f" />
            <circle cx="830" cy="440" r="4" fill="#d6b57f" fillOpacity=".7" />
          </g>
          <g className="orbit-rev">
            <circle cx="440" cy="730" r="4" fill="#f0d9ad" fillOpacity=".8" />
            <circle cx="300" cy="320" r="3" fill="#d6b57f" />
            <circle cx="620" cy="300" r="3" fill="#d6b57f" fillOpacity=".6" />
          </g>
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_40px_rgb(214_181_127/0.5)]">
          <LogoMark size={76} />
        </div>
      </div>
      {/* knowledge flowing in */}
      <div className="absolute top-[22%] left-[52%] hidden -rotate-3 rounded-full border border-cream/10 bg-night/60 px-3.5 py-1.5 text-[12px] text-cream/80 backdrop-blur lg:block">📄 Workbook.pdf</div>
      <div className="absolute top-[52%] left-[60%] hidden rotate-2 rounded-full border border-cream/10 bg-night/60 px-3.5 py-1.5 text-[12px] text-cream/80 backdrop-blur xl:block">🎙️ Podcast · ep. 42</div>
      <div className="absolute top-[58%] left-[90%] hidden -rotate-2 rounded-full border border-cream/10 bg-night/60 px-3.5 py-1.5 text-[12px] text-cream/80 backdrop-blur xl:block">🔗 yoursite.com/blog</div>
      <div className="absolute inset-0 bg-gradient-to-t from-night-2 via-night-2/30 to-transparent" />
    </div>
  );
}

function LiveCard({ href }: { href: string }) {
  return (
    <div className="absolute top-24 right-4 hidden w-[300px] rounded-[20px] border border-cream/10 bg-night/55 p-3 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.7)] backdrop-blur-xl md:block lg:top-28 lg:right-10">
      <div className="space-y-2 rounded-[14px] bg-night-3/80 p-3 text-[12.5px]">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-cream px-3 py-1.5 text-night">Big pitch tomorrow and I&apos;m spiraling 😬</div>
        <div className="w-fit max-w-[92%] rounded-2xl rounded-tl-md bg-cream/10 px-3 py-1.5 leading-relaxed text-cream/90">
          Normal. Let&apos;s do the 3-breath reset, then name the <b className="text-gold">one</b> thing they must remember. What is it?
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 px-1 pb-0.5">
        <div className="min-w-0 flex-1">
          <div className="eyebrow flex items-center gap-1.5 text-[10px]">
            <span className="pulse-dot size-1.5 rounded-full bg-emerald-400" /> Live · 2:14 am
          </div>
          <div className="mt-1 truncate text-[14px] font-medium">Answering while you sleep</div>
        </div>
        <Link href={href} aria-label="See a mind in action" className="grid size-10 shrink-0 place-items-center rounded-full border border-cream/20 text-cream transition hover:border-gold hover:text-gold">
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
