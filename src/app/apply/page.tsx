import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand";
import { ApplyForm } from "@/components/site/ApplyForm";
import { getCoach } from "@/lib/auth";
import { read } from "@/lib/db";

export const metadata = { title: "Apply as a coach" };

export default async function ApplyPage() {
  if (await getCoach()) redirect("/dashboard");
  if ((await read()).settings.signupMode === "open") redirect("/signup");
  return (
    <div className="mesh min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center px-5">
        <Logo />
      </header>
      <main className="mx-auto grid max-w-6xl items-start gap-12 px-5 py-10 lg:grid-cols-[1fr_520px] lg:py-16">
        <div className="lg:pt-8">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Bring your coaching mind to life.</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">We&apos;re onboarding coaches in small groups so every launch gets attention. Tell us a little about you.</p>
          <ul className="mt-8 space-y-3.5">
            {["An AI that coaches in your voice, 24/7", "Charge with memberships, trials and message packs", "Payouts straight to your bank via Stripe", "Hands-on help getting your first mind live"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-[15px]">
                <span className="grid size-6 place-items-center rounded-full bg-violet-600 text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/85 p-7 shadow-lift backdrop-blur sm:p-8">
          <ApplyForm />
        </div>
      </main>
    </div>
  );
}
