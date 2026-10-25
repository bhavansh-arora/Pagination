"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "../brand";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#earn", label: "Earnings" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader({ cta, signedIn }: { cta: { href: string; label: string }; signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cn("sticky top-0 z-40 transition-all", scrolled ? "border-b border-line/70 bg-white/80 backdrop-blur-xl" : "bg-transparent")}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {!signedIn && (
            <Link href="/login" className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted hover:text-ink">
              Sign in
            </Link>
          )}
          <Link href={cta.href} className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-black">
            {cta.label}
          </Link>
        </div>
        <button className="ml-auto rounded-lg p-2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-white px-5 pb-5 md:hidden">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-3 text-sm font-medium">
              {l.label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/login" className="rounded-xl border border-line py-2.5 text-center text-sm font-medium">
              Sign in
            </Link>
            <Link href={cta.href} className="rounded-xl bg-ink py-2.5 text-center text-sm font-medium text-white">
              {cta.label}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
