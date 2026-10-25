import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2 text-[13px] font-medium text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-[28px] leading-none font-semibold tracking-tight tabular-nums">{value}</div>
      {sub && <div className="mt-2 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-line bg-white shadow-soft", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Pill({ tone, children }: { tone: "green" | "amber" | "red" | "violet" | "zinc"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        tone === "green" && "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
        tone === "amber" && "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70",
        tone === "red" && "bg-rose-50 text-rose-700 ring-1 ring-rose-200/70",
        tone === "violet" && "bg-violet-50 text-violet-700 ring-1 ring-violet-200/70",
        tone === "zinc" && "bg-zinc-100 text-zinc-600",
      )}
    >
      {children}
    </span>
  );
}

export const th = "px-4 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted uppercase whitespace-nowrap";
export const td = "px-4 py-3 align-middle";

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-6 py-12 text-center text-sm text-muted">{children}</div>;
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 text-xs font-semibold text-violet-800", className)}>
      {initials || "?"}
    </span>
  );
}
