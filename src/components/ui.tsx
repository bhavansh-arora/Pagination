"use client";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";
export { cn };

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all select-none",
        "focus-visible:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-[15px]",
        variant === "primary" &&
          "bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_8px_20px_-8px_rgb(124_58_237/0.7)] hover:from-violet-500 hover:to-violet-700 focus-visible:ring-violet-200",
        variant === "dark" && "bg-ink text-white hover:bg-black focus-visible:ring-violet-200",
        variant === "secondary" && "border border-line bg-white text-ink shadow-soft hover:bg-zinc-50 focus-visible:ring-violet-100",
        variant === "ghost" && "text-muted hover:bg-black/[0.04] hover:text-ink focus-visible:ring-violet-100",
        variant === "danger" && "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 focus-visible:ring-rose-100",
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
});

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink placeholder:text-zinc-400 shadow-[0_1px_0_rgb(0_0_0/0.02)] transition focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(field, "h-10", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...p },
  ref,
) {
  return <textarea ref={ref} className={cn(field, "min-h-24 resize-y py-2.5 leading-relaxed", className)} {...p} />;
});

export function Field({ label, hint, children, aside }: { label: string; hint?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink">{label}</span>
        {aside && <span className="text-xs text-muted">{aside}</span>}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-line bg-white shadow-soft", className)}>{children}</div>;
}

export function Section({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-5">{children}</div>
    </Card>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "live" | "draft" | "violet"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        tone === "neutral" && "bg-zinc-100 text-zinc-600",
        tone === "live" && "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
        tone === "draft" && "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70",
        tone === "violet" && "bg-violet-50 text-violet-700 ring-1 ring-violet-200/70",
      )}
    >
      {tone === "live" && <span className="size-1.5 rounded-full bg-emerald-500" />}
      {children}
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string; blurb?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-1 rounded-xl bg-zinc-100/80 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          type="button"
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-lg px-3 py-2 text-left transition",
            value === o.id ? "bg-white shadow-soft" : "text-muted hover:text-ink",
          )}
        >
          <div className="text-[13px] font-semibold">{o.label}</div>
          {o.blurb && <div className="mt-0.5 text-[11px] leading-snug text-muted">{o.blurb}</div>}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
        checked ? "bg-emerald-500" : "bg-zinc-300",
      )}
    >
      <span className={cn("inline-block size-5 rounded-full bg-white shadow transition", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}
