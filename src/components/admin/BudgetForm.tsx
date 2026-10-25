"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "../ui";
import { api } from "./AdminClient";

export function BudgetForm({ cents }: { cents: number }) {
  const router = useRouter();
  const [value, setValue] = useState(cents ? String(cents / 100) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
          const n = parseFloat(value);
          await api("/api/admin/settings", "PATCH", { aiMonthlyBudget: Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0 });
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="relative">
        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">$</span>
        <Input inputMode="decimal" className="h-9 w-32 pl-7" value={value} placeholder="No budget" onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))} />
      </div>
      <span className="text-sm text-muted">/ month</span>
      <Button size="sm" variant="secondary" type="submit" loading={saving}>
        Save
      </Button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </form>
  );
}
