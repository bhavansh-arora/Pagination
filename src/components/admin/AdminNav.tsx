"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BadgePercent, Brain, CircleDollarSign, Cpu, LayoutDashboard, MailPlus, Rocket, Settings, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/revenue", label: "Revenue", icon: CircleDollarSign },
  { href: "/admin/usage", label: "AI usage & cost", icon: Cpu },
  { href: "/admin/onboarding", label: "Coach onboarding", icon: Rocket },
  { href: "/admin/coaches", label: "Coaches", icon: Users },
  { href: "/admin/minds", label: "Minds", icon: Brain },
  { href: "/admin/invites", label: "Invites", icon: MailPlus },
  { href: "/admin/plans", label: "Plans & fees", icon: BadgePercent },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/activity", label: "Activity log", icon: Activity },
];

export function AdminNav({ horizontal }: { horizontal?: boolean }) {
  const path = usePathname();
  return (
    <nav className={cn(horizontal ? "flex gap-1" : "space-y-0.5")}>
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition",
              active ? "bg-violet-50 text-violet-900" : "text-zinc-600 hover:bg-black/[0.04] hover:text-ink",
            )}
          >
            <Icon className={cn("size-4", active ? "text-violet-600" : "text-zinc-400")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
