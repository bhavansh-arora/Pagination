import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { Coach } from "@/lib/db";
import { Logo } from "./brand";
import { NavLink, SignOutButton } from "./DashboardClient";

export function StudioHeader({ coach }: { coach: Coach }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Logo href="/dashboard" />
        <nav className="hidden items-center gap-1 sm:flex">
          <NavLink href="/dashboard">My minds</NavLink>
          <NavLink href="/dashboard/earnings">Earnings</NavLink>
          <NavLink href="/dashboard/plan">Plan</NavLink>
          <NavLink href="/dashboard/account">Account</NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {coach.role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-ink px-3 text-[13px] font-medium text-white hover:bg-black"
            >
              <ShieldCheck className="size-4" /> Admin
            </Link>
          )}
          <span className="hidden text-sm text-muted md:inline">{coach.name}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
