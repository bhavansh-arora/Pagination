import type { Coach, Plan, Settings } from "./db";

export function planFor(settings: Settings, coach: Pick<Coach, "planId">): Plan {
  return (
    settings.plans.find((p) => p.id === coach.planId) ??
    settings.plans.find((p) => p.id === settings.defaultPlanId) ??
    settings.plans[0]
  );
}

export const feeFor = (amount: number, pct: number) => Math.round((amount * pct) / 100);
