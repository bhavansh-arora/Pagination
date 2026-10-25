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
    <div className="site grain min-h-dvh font-display">
      <header className="mx-auto flex h-20 max-w-[1400px] items-center px-5 sm:px-10">
        <Logo tone="dark" />
      </header>
      <main className="mx-auto grid max-w-[1400px] items-start gap-12 px-5 pt-6 pb-16 sm:px-10 lg:grid-cols-[1fr_520px] lg:pt-14">
        <div className="lg:pt-6">
          <div className="eyebrow flex items-center gap-2">
            <span className="pulse-dot size-1.5 rounded-full bg-gold" /> Onboarding a small group each month
          </div>
          <h1 className="mt-6 text-[56px] leading-[0.92] font-medium tracking-[-0.055em] sm:text-[84px]">
            Bring your
            <br />
            <span className="serif-accent text-[1.06em]">mind to life.</span>
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-cream/65">We&apos;re onboarding coaches in small groups so every launch gets attention. Tell us a little about you.</p>
          <ul className="mt-10 border-t border-cream/10">
            {["An AI that coaches in your voice, 24/7", "Charge with memberships, trials and message packs", "Payouts straight to your bank via Stripe", "Hands-on help getting your first mind live"].map((t, i) => (
              <li key={t} className="flex items-center gap-4 border-b border-cream/10 py-4 text-[16px] text-cream/85">
                <span className="font-mono text-[11px] text-stone">0{i + 1}</span>
                <span className="flex-1">{t}</span>
                <Check className="size-4 text-gold" strokeWidth={2.5} />
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[22px] bg-cream p-6 font-sans text-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] sm:p-8">
          <ApplyForm />
        </div>
      </main>
    </div>
  );
}
