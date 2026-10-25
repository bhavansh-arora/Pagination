import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  Clock,
  CreditCard,
  FileText,
  Globe,
  Infinity as InfinityIcon,
  KeyRound,
  Link2,
  Lock,
  MessagesSquare,
  Mic,
  Play,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { EarningsCalculator } from "@/components/site/EarningsCalculator";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getCoach } from "@/lib/auth";
import { read } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const metadata = {
  title: { absolute: "Mindclone — Turn your coaching into an AI your clients can talk to 24/7" },
  description:
    "Train an AI on your courses, content and frameworks. It coaches in your voice, around the clock — and you can charge for access with memberships and message packs.",
  openGraph: {
    title: "Mindclone — your coaching mind, available 24/7",
    description: "Train an AI on your content. Clients talk to it like a GPT built from you. You get paid.",
  },
};

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
    <div className="min-h-dvh bg-canvas">
      <div className="mesh">
        <SiteHeader cta={{ href: startHref, label: startLabel }} signedIn={!!coach} />

        {/* HERO */}
        <section className="mx-auto max-w-6xl px-5 pt-14 pb-20 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-violet-700 backdrop-blur">
              <Sparkles className="size-3.5" /> For coaches, consultants & creators
            </span>
            <h1 className="mt-6 text-[42px] leading-[1.04] font-semibold tracking-[-0.04em] text-balance sm:text-[64px]">
              Your coaching,
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent"> available 24/7.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted">
              Train an AI on your courses, content and frameworks. Clients talk to it like a personal GPT of you, and you earn from every conversation.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={startHref}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-violet-600 px-7 text-[15px] font-semibold text-white shadow-[0_12px_32px_-10px_rgb(124_58_237/0.8)] transition hover:to-violet-700 sm:w-auto"
              >
                {startLabel} <ArrowRight className="size-4" />
              </Link>
              {demo ? (
                <Link
                  href={demo}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white/80 px-6 text-[15px] font-semibold shadow-soft backdrop-blur transition hover:bg-white sm:w-auto"
                >
                  <Play className="size-4 fill-current" /> Try a live demo
                </Link>
              ) : (
                <a
                  href="#how"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white/80 px-6 text-[15px] font-semibold shadow-soft backdrop-blur transition hover:bg-white sm:w-auto"
                >
                  See how it works
                </a>
              )}
            </div>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
              {["No code needed", "Live in under 30 minutes", "You set the price"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-600" strokeWidth={2.5} /> {t}
                </li>
              ))}
            </ul>
          </div>

          <HeroVisual />
        </section>
      </div>

      {/* PROBLEM */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Your best advice shouldn&apos;t be limited by your calendar.</h2>
          <p className="mt-4 text-lg text-muted">You can only take so many calls. Your clients need you most at 11pm before a big decision, not at their next session.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { icon: Clock, title: "Capped by your hours", body: "1:1 time doesn't scale. Every new client means more of your week." },
            { icon: Users, title: "Clients stall between sessions", body: "Momentum dies in the gaps, when doubts show up and you're not there." },
            { icon: BookOpen, title: "Your content gathers dust", body: "Courses and posts are full of answers that clients never find when they need them." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-3xl border border-line bg-white p-7 shadow-soft">
              <span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-500">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="scroll-mt-20 border-y border-line bg-white py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHead eyebrow="How it works" title="From your content to a paid AI coach in three steps" />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "1",
                icon: Upload,
                title: "Feed it your mind",
                body: "Upload PDFs, docs and transcripts, paste links to your blog and podcast, or write notes. Then describe your philosophy and voice.",
                chips: [
                  [FileText, "Workbook.pdf"],
                  [Link2, "yoursite.com/blog"],
                  [Mic, "Podcast transcript"],
                ],
              },
              {
                n: "2",
                icon: Brain,
                title: "Test until it sounds like you",
                body: "Chat with it in a live playground beside every setting. Tweak tone, rules and knowledge until it answers the way you would.",
                chips: [
                  [Sparkles, "Warm & direct"],
                  [Check, "Uses your frameworks"],
                ],
              },
              {
                n: "3",
                icon: Wallet,
                title: "Share it and get paid",
                body: "Publish a beautiful chat link or embed it on your site. Offer a free trial, then memberships or message packs. Payouts go straight to you.",
                chips: [
                  [Globe, "yourname.ai link"],
                  [CreditCard, "Stripe payouts"],
                ],
              },
            ].map((s) => (
              <div key={s.n} className="relative rounded-3xl border border-line bg-canvas p-7">
                <span className="absolute top-6 right-6 text-5xl font-semibold text-zinc-100">{s.n}</span>
                <span className="grid size-11 place-items-center rounded-2xl bg-violet-600 text-white shadow-[0_8px_20px_-8px_rgb(124_58_237/0.8)]">
                  <s.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {s.chips.map(([Icon, label], i) => {
                    const I = Icon as typeof FileText;
                    return (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
                        <I className="size-3.5 text-violet-500" /> {label as string}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
        <SectionHead eyebrow="Everything included" title="Built for coaches, not engineers" />
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Feature className="md:col-span-4" icon={Brain} title="Thinks and talks like you" body="Persona, philosophy, tone, reply length and your own coaching rules — powered by Anthropic's Claude.">
            <div className="mt-6 space-y-2.5 rounded-2xl bg-zinc-50 p-4 text-sm">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-white">I keep starting things and never finishing.</div>
              <div className="w-fit max-w-[90%] rounded-2xl rounded-tl-md border border-line bg-white px-3.5 py-2 leading-relaxed">
                That&apos;s the classic <b>shiny-object loop</b> we talk about in module 3. Before we fix it: what were you hoping the <i>next</i> thing would give you that the last one didn&apos;t?
              </div>
            </div>
          </Feature>
          <Feature className="md:col-span-2" icon={BookOpen} title="Learns from everything" body="PDFs, Word docs, transcripts, web pages and notes. Large libraries are searched automatically." />
          <Feature className="md:col-span-2" icon={CreditCard} title="Charge your way" body="Free, free trial, monthly or yearly memberships, and one-time message packs." />
          <Feature className="md:col-span-2" icon={KeyRound} title="Public or private" body="Open link for lead generation, or an access code for paying clients only." />
          <Feature className="md:col-span-2" icon={BarChart3} title="See what clients ask" body="Read conversations, spot patterns, and turn them into content and offers." />
          <Feature className="md:col-span-3" icon={MessagesSquare} title="A beautiful client app" body="A ChatGPT-style experience in your colors, with chat history, accounts and mobile support." />
          <Feature className="md:col-span-3" icon={ShieldCheck} title="Safe by default" body="Honest about being an AI, crisis-aware, and refers medical, legal and financial decisions to professionals." />
        </div>
      </section>

      {/* EARNINGS */}
      <section id="earn" className="scroll-mt-20 bg-[#100d1a] py-24 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-semibold tracking-wide text-violet-300 uppercase">Earnings</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Turn your expertise into recurring revenue</h2>
            <p className="mt-4 text-lg text-white/60">Clients pay you directly. Move the sliders to see what you&apos;d keep on each plan.</p>
          </div>
          <div className="mt-12">
            <EarningsCalculator
              currency={cur}
              plans={plans.map((p) => ({ id: p.id, name: p.name, priceMonthly: p.priceMonthly, commissionPct: p.commissionPct, highlight: p.highlight }))}
            />
          </div>
        </div>
      </section>

      {/* CLIENT EXPERIENCE */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-24 lg:grid-cols-2">
        <div>
          <div className="text-sm font-semibold tracking-wide text-violet-600 uppercase">For your clients</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Feels like texting their coach, any time</h2>
          <ul className="mt-8 space-y-5">
            {[
              [InfinityIcon, "Always available", "Clarity at 2am, before the big meeting, or between sessions."],
              [Lock, "Private & personal", "Their own account and conversation history, on any device."],
              [Wallet, "Simple to pay", "A few free messages to try, then a membership or a message pack — checkout by Stripe."],
            ].map(([Icon, t, b]) => {
              const I = Icon as typeof Lock;
              return (
                <li key={t as string} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
                    <I className="size-5" />
                  </span>
                  <div>
                    <div className="font-semibold">{t as string}</div>
                    <div className="mt-0.5 text-sm text-muted">{b as string}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <PhoneMock />
      </section>

      {/* PRICING */}
      <section id="pricing" className="scroll-mt-20 border-y border-line bg-white py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHead eyebrow="Pricing" title="Start free. Upgrade as you grow." sub={`Keep up to ${100 - lowestFee}% of every client payment.`} />
          <div className={`mx-auto mt-14 grid max-w-5xl gap-5 ${plans.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {plans.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-3xl border p-7 ${p.highlight ? "border-violet-300 bg-gradient-to-b from-violet-50/80 to-white shadow-lift ring-4 ring-violet-100" : "border-line bg-white shadow-soft"}`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1 text-[11px] font-bold text-white">Most popular</span>
                )}
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="mt-1 min-h-10 text-sm text-muted">{p.tagline}</div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{p.priceMonthly === 0 ? "Free" : formatMoney(p.priceMonthly, cur)}</span>
                  {p.priceMonthly > 0 && <span className="text-sm text-muted">/ month</span>}
                </div>
                <div className="mt-1 text-sm font-medium text-violet-700">{p.commissionPct}% fee on client payments</div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-zinc-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-violet-600" strokeWidth={2.5} /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={startHref}
                  className={`mt-7 inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition ${p.highlight ? "bg-violet-600 text-white hover:bg-violet-700" : "bg-ink text-white hover:bg-black"}`}
                >
                  {coach ? "Choose in your studio" : open ? (p.priceMonthly ? `Start with ${p.name}` : "Start free") : "Apply for access"}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted">Card processing fees by Stripe apply. Cancel or change plans any time.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-24">
        <SectionHead eyebrow="FAQ" title="Questions coaches ask" />
        <div className="mt-12 divide-y divide-line rounded-3xl border border-line bg-white shadow-soft">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-zinc-100 text-lg leading-none text-zinc-500 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 px-6 py-16 text-center text-white shadow-lift sm:py-20">
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">Clone your coaching mind today.</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-lg text-white/80">Set it up this afternoon. Let it coach your clients tonight.</p>
          <Link
            href={startHref}
            className="relative mt-9 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[15px] font-semibold text-violet-700 shadow-lift transition hover:bg-violet-50"
          >
            {startLabel} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:flex-row">
          <Logo />
          <div className="flex flex-wrap items-center justify-center gap-5">
            <a href="#pricing" className="hover:text-ink">
              Pricing
            </a>
            <Link href="/login" className="hover:text-ink">
              Coach sign in
            </Link>
            <Link href="/me" className="hover:text-ink">
              Client account
            </Link>
            <span>© {new Date().getFullYear()} Mindclone</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-sm font-semibold tracking-wide text-violet-600 uppercase">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-muted">{sub}</p>}
    </div>
  );
}

function Feature({ icon: Icon, title, body, className, children }: { icon: typeof Brain; title: string; body: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={`rounded-3xl border border-line bg-white p-7 shadow-soft ${className ?? ""}`}>
      <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
      {children}
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="rounded-[28px] border border-white/60 bg-white/50 p-2 shadow-lift backdrop-blur">
        <div className="grid overflow-hidden rounded-[22px] border border-line bg-white text-left md:grid-cols-[220px_1fr]">
          <div className="hidden border-r border-line bg-[#f8f7fa] p-4 md:block">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-violet-100 text-lg">🌿</span>
              <div>
                <div className="text-sm font-semibold">Clarity Coach AI</div>
                <div className="text-[11px] text-muted">by your coach</div>
              </div>
            </div>
            <div className="mt-5 space-y-1.5 text-[13px]">
              {["Launch anxiety", "Pricing my offer", "Weekly plan"].map((t, i) => (
                <div key={t} className={`truncate rounded-lg px-2.5 py-2 ${i === 0 ? "bg-white font-medium shadow-soft" : "text-zinc-500"}`}>
                  {t}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-violet-300 bg-violet-50 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <Sparkles className="size-3 text-violet-600" /> Member
              </div>
              <div className="mt-0.5 text-[11px] text-muted">Unlimited conversations</div>
            </div>
          </div>
          <div className="flex flex-col gap-4 p-5 sm:p-7">
            <div className="ml-auto max-w-[80%] rounded-3xl rounded-br-lg bg-violet-100 px-4 py-2.5 text-[14px]">
              I keep putting off launching my offer. What do I do?
            </div>
            <div className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-violet-100">🌿</span>
              <div className="text-[14px] leading-relaxed text-zinc-700">
                Let&apos;s use the <b className="text-ink">Clarity Reset</b> from week 2.
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Name the scariest outcome if it launches and nobody buys.</li>
                  <li>Shrink the launch to something you can ship by Friday.</li>
                  <li>Tell one person today — accountability beats motivation.</li>
                </ol>
                <p className="mt-2">What&apos;s the smallest version you could share this week?</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-full border border-line p-1.5 pl-4 text-sm text-zinc-400 shadow-soft">
              Message Clarity Coach AI…
              <span className="ml-auto grid size-8 place-items-center rounded-full bg-violet-600 text-white">
                <ArrowRight className="size-4 -rotate-90" />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-4 hidden rotate-[-3deg] rounded-2xl border border-line bg-white p-4 shadow-lift sm:block">
        <div className="text-[11px] font-medium text-muted">New member</div>
        <div className="mt-0.5 flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          Monthly membership started
        </div>
      </div>
      <div className="absolute -top-5 -right-3 hidden rotate-[3deg] rounded-2xl border border-line bg-white px-4 py-3 shadow-lift sm:block">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="size-4 text-violet-600" /> Answering at 11:42 pm
        </div>
      </div>
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-gradient-to-br from-violet-200 to-fuchsia-200 blur-3xl" />
      <div className="rounded-[44px] border-[10px] border-ink bg-white shadow-lift">
        <div className="flex items-center gap-2 border-b border-line px-4 pt-6 pb-3">
          <span className="grid size-8 place-items-center rounded-full bg-violet-100">🌿</span>
          <span className="text-sm font-semibold">Clarity Coach AI</span>
        </div>
        <div className="space-y-3 px-4 py-5 text-[13px]">
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-violet-100 px-3 py-2">Big pitch tomorrow and I&apos;m spiraling 😬</div>
          <div className="w-fit max-w-[90%] rounded-2xl rounded-tl-md bg-zinc-100 px-3 py-2 leading-relaxed">
            Totally normal. Let&apos;s do the 3-breath reset, then name the <b>one</b> thing they must remember. What is it?
          </div>
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-violet-100 px-3 py-2">That we save them 10 hours a week.</div>
          <div className="w-fit max-w-[90%] rounded-2xl rounded-tl-md bg-zinc-100 px-3 py-2 leading-relaxed">Perfect. Open with that. Say it out loud twice now ✨</div>
        </div>
        <div className="mx-4 mb-3 text-center text-[11px] text-zinc-500">
          3 free messages left · <span className="font-semibold text-violet-600">See plans</span>
        </div>
        <div className="mx-4 mb-6 flex items-center rounded-full border border-line px-3 py-2 text-[12px] text-zinc-400">Message…</div>
      </div>
    </div>
  );
}
