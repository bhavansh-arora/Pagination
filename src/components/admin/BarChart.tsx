"use client";
import { useState } from "react";
import { formatMoney } from "@/lib/money";

function microUsd(v: number) {
  const n = v / 1e6;
  if (n === 0) return "$0";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}

export function BarChart({
  data,
  unit,
  currency,
  micros,
  budgetLine,
}: {
  data: { day: string; value: number }[];
  unit: string;
  currency?: string;
  /** Values are millionths of a USD. */
  micros?: boolean;
  /** Optional horizontal reference line (same units as values), e.g. daily budget. */
  budgetLine?: number;
}) {
  const fmt = (v: number) => (micros ? microUsd(v) : currency ? formatMoney(v, currency, { compact: true }) : v.toLocaleString());
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, budgetLine ?? 0, ...data.map((d) => d.value));
  const ticks = [max, Math.round(max / 2), 0].filter((v, i, a) => a.indexOf(v) === i);
  const label = (day: string) => new Date(day + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <figure className="px-5 pt-4 pb-3">
      <div className="relative flex h-44 gap-3">
        <div className="flex flex-col justify-between pb-6 text-right text-[11px] text-muted tabular-nums">
          {ticks.map((t) => (
            <span key={t}>{fmt(t)}</span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {ticks.map((t) => (
              <div key={t} className="border-t border-dashed border-zinc-100" />
            ))}
          </div>
          {budgetLine ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6">
              <div className="absolute inset-x-0 border-t-2 border-dashed border-amber-400" style={{ bottom: `${(budgetLine / max) * 100}%` }}>
                <span className="absolute -top-5 left-0 rounded bg-amber-50 px-1.5 text-[10px] font-semibold text-amber-700">daily budget {fmt(budgetLine)}</span>
              </div>
            </div>
          ) : null}
          <div className="absolute inset-x-0 top-0 bottom-6 flex items-end gap-[2px]" role="img" aria-label={`${unit} per day`}>
            {data.map((d, i) => (
              <div
                key={d.day}
                className="relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className="w-full rounded-t-[4px] bg-violet-500 transition-opacity"
                  style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 3 : 0, opacity: hover === null || hover === i ? 1 : 0.45 }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lift">
                    <div className="text-zinc-400">{label(d.day)}</div>
                    <div className="font-semibold tabular-nums">
                      {micros ? microUsd(d.value) : currency ? formatMoney(d.value, currency) : d.value.toLocaleString()} {unit}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[11px] text-muted">
            <span>{label(data[0].day)}</span>
            <span>{label(data[data.length - 1].day)}</span>
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{unit} per day</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <th>{d.day}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
