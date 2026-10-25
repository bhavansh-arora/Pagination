import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Link2, Lock, MessagesSquare, Share2, Sparkles, Upload } from "lucide-react";
import { Logo } from "@/components/brand";
import { getCoach } from "@/lib/auth";

const features = [
  { icon: Upload, title: "Feed it everything", body: "Drop in PDFs, Word docs, transcripts and notes, or paste links to your blog, podcast pages and courses." },
  { icon: Brain, title: "It thinks like you", body: "Describe your philosophy, tone and frameworks. Your mind answers in your voice, grounded in your material." },
  { icon: Share2, title: "Share in one link", body: "Clients get a beautiful ChatGPT-style app. Make it public or lock it with an access code for paying clients." },
  { icon: MessagesSquare, title: "See what clients ask", body: "Read every conversation, spot recurring struggles, and turn them into new content and offers." },
  { icon: Lock, title: "Safe by design", body: "Built-in guardrails for crisis situations, medical and legal topics — plus your own boundaries." },
  { icon: Sparkles, title: "Powered by Claude", body: "Pick from Anthropic's latest models and how deeply your mind should reflect before it replies." },
];

export default async function Home() {
  const coach = await getCoach();
  return (
    <div className="mesh min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          {coach ? (
            <Link href="/dashboard" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-black">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-muted hover:text-ink">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-black">
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="pt-16 pb-20 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-violet-700 backdrop-blur">
            <Sparkles className="size-3.5" /> For coaches, mentors & creators
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-[44px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-6xl">
            Clone your coaching mind.
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent"> Let clients talk to it 24/7.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted">
            Train an AI on your courses, posts, transcripts and frameworks. It answers in your voice, with your methods — like a personal GPT of you.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={coach ? "/dashboard" : "/signup"}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-violet-600 px-6 text-[15px] font-medium text-white shadow-[0_10px_30px_-10px_rgb(124_58_237/0.8)] hover:to-violet-700"
            >
              Build your mind <ArrowRight className="size-4" />
            </Link>
            <span className="text-sm text-muted">Takes about 5 minutes</span>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="rounded-[28px] border border-white/60 bg-white/50 p-2 shadow-lift backdrop-blur">
              <div className="grid overflow-hidden rounded-[22px] border border-line bg-white text-left sm:grid-cols-[1fr_1.3fr]">
                <div className="border-b border-line p-6 sm:border-r sm:border-b-0">
                  <div className="text-xs font-semibold tracking-wide text-muted uppercase">Knowledge</div>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {[
                      [BookOpen, "Signature Program Workbook.pdf", "48k words"],
                      [Link2, "mysite.com/blog/mindset-reset", "3.2k words"],
                      [BookOpen, "Podcast ep. 41 transcript.txt", "9.1k words"],
                      [Brain, "My 5-step clarity framework", "Note"],
                    ].map(([Icon, t, m], i) => {
                      const I = Icon as typeof BookOpen;
                      return (
                        <li key={i} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                          <I className="size-4 text-violet-500" />
                          <span className="flex-1 truncate font-medium">{t as string}</span>
                          <span className="text-xs text-muted">{m as string}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="flex flex-col gap-3 bg-zinc-50/60 p-6">
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-white">
                    I keep procrastinating on launching my offer. What do I do?
                  </div>
                  <div className="flex gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-violet-100 text-base">🌿</span>
                    <div className="rounded-2xl rounded-tl-md border border-line bg-white px-4 py-2.5 text-sm leading-relaxed">
                      Let's use the <b>Clarity Reset</b> from week 2. First — what's the scariest thing that happens if it launches and nobody buys? Name it. Then we'll shrink the launch to something you can ship by Friday.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-line bg-white/80 p-6 shadow-soft backdrop-blur">
              <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-line/80 py-8 text-center text-xs text-muted">© {new Date().getFullYear()} Mindclone</footer>
    </div>
  );
}
