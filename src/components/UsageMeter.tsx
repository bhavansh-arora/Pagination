import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/cn";

export function UsageMeter({ used, limit, planName, resetsOn, upgradeHref }: { used: number; limit: number; planName: string; resetsOn: Date; upgradeHref?: string }) {
  if (!limit) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/80 px-5 py-4 text-sm shadow-soft">
        <Zap className="size-4 text-violet-500" />
        <span>
          <b className="tabular-nums">{used.toLocaleString()}</b> AI replies this month · unlimited on {planName}
        </span>
      </div>
    );
  }
  const ratio = used / limit;
  const tone = ratio >= 1 ? "red" : ratio >= 0.8 ? "amber" : "violet";
  const reset = resetsOn.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  return (
    <div className={cn("rounded-2xl border px-5 py-4 shadow-soft", tone === "red" ? "border-rose-200 bg-rose-50/70" : tone === "amber" ? "border-amber-200 bg-amber-50/70" : "border-line bg-white/80")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Zap className={cn("size-4", tone === "red" ? "text-rose-500" : tone === "amber" ? "text-amber-500" : "text-violet-500")} />
          <span>
            <b className="tabular-nums">{used.toLocaleString()}</b> of {limit.toLocaleString()} AI replies used this month
          </span>
        </div>
        <span className="text-xs text-muted">Resets {reset}</span>
        {upgradeHref && ratio >= 0.8 && (
          <Link href={upgradeHref} className="ml-auto text-sm font-semibold text-violet-700 hover:underline">
            Upgrade for more →
          </Link>
        )}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5">
        <div
          className={cn("h-full rounded-full", tone === "red" ? "bg-rose-500" : tone === "amber" ? "bg-amber-500" : "bg-violet-500")}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>
      {ratio >= 1 && <p className="mt-2 text-sm text-rose-700">Your minds are paused until {reset}. Clients see a friendly “back soon” message.</p>}
    </div>
  );
}
