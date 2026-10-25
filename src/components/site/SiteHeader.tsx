"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "../brand";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#minds", label: "Minds" },
  { href: "#earn", label: "Earnings" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader({ cta, signedIn }: { cta: { href: string; label: string }; signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="scroll-progress fixed inset-x-0 top-0 z-[55] h-[2px] bg-gold" />
      <header className="fixed inset-x-0 top-0 z-50 px-2.5 pt-2.5 sm:px-3.5 sm:pt-3.5">
        <div
          className={cn(
            "mx-auto flex h-14 items-center gap-6 rounded-full px-4 transition-all duration-300 sm:h-16 sm:px-6",
            scrolled ? "max-w-5xl border border-cream/10 bg-night/75 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.6)] backdrop-blur-xl" : "max-w-[1400px] border border-transparent",
          )}
        >
          <Logo tone="dark" />
          <nav className="mx-auto hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="rounded-full px-3.5 py-1.5 text-[14px] text-cream/75 transition hover:text-cream">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 lg:ml-0 md:flex">
            {!signedIn && (
              <Link href="/login" className="rounded-full px-3.5 py-2 text-[14px] text-cream/75 transition hover:text-cream">
                Sign in
              </Link>
            )}
            <Link href={cta.href} className="rounded-full bg-gold px-5 py-2.5 text-[14px] font-medium text-night transition hover:bg-[#e3c595]">
              {cta.label}
            </Link>
          </div>
          <button
            className="ml-auto grid size-10 place-items-center rounded-full border border-cream/15 text-cream md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-[18px]" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-night px-5 pt-5 pb-8 md:hidden">
          <div className="flex items-center justify-between">
            <Logo tone="dark" />
            <button className="grid size-10 place-items-center rounded-full border border-cream/15 text-cream" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="size-[18px]" />
            </button>
          </div>
          <nav className="mt-12 flex flex-col">
            {LINKS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-4 border-b border-cream/10 py-4 font-display text-[34px] font-medium tracking-[-0.04em] text-cream"
              >
                <span className="eyebrow">0{i + 1}</span>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-auto grid gap-2.5">
            <Link href={cta.href} className="flex h-13 items-center justify-between rounded-full bg-gold pr-2 pl-6 font-medium text-night">
              {cta.label}
              <span className="grid size-9 place-items-center rounded-full bg-night text-gold">
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
            {!signedIn && (
              <Link href="/login" className="flex h-13 items-center justify-center rounded-full border border-cream/20 font-medium text-cream">
                Coach sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
