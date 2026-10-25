"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import type { Settings } from "@/lib/db";
import { Button, Field, Input, Section, Segmented } from "../ui";
import { api } from "./AdminClient";

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("saving");
        setError("");
        try {
          await api("/api/admin/settings", "PATCH", { signupMode: s.signupMode, visitorMessagesPer10Min: s.visitorMessagesPer10Min, demoSlug: s.demoSlug });
          setState("saved");
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
          setState("idle");
        }
      }}
    >
      <Section title="Coach sign-ups" description="Who can create a coach account from the sign-up page.">
        <Segmented
          value={s.signupMode}
          options={[
            { id: "open", label: "Open", blurb: "Anyone can sign up" },
            { id: "invite", label: "Invite only", blurb: "Needs an invite link" },
            { id: "closed", label: "Closed", blurb: "Admins add accounts" },
          ]}
          onChange={(signupMode) => {
            setS({ ...s, signupMode });
            setState("idle");
          }}
        />
      </Section>
      <Section title="Website" description="Shown on the homepage as a live demo people can try.">
        <Field label="Demo mind link" hint="The link name of a published, free mind (the part after /c/). Leave empty to hide the demo button.">
          <Input
            value={s.demoSlug}
            placeholder="maya-ai"
            onChange={(e) => {
              setS({ ...s, demoSlug: e.target.value.trim() });
              setState("idle");
            }}
          />
        </Field>
      </Section>
      <Section title="Limits" description="Protect your API budget.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Client messages per 10 min" hint="Per visitor IP, per mind.">
            <Input
              type="number"
              min={1}
              max={10000}
              value={s.visitorMessagesPer10Min}
              onChange={(e) => {
                setS({ ...s, visitorMessagesPer10Min: Number(e.target.value) });
                setState("idle");
              }}
            />
          </Field>
        </div>
      </Section>
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!dirty} loading={state === "saving"}>
          Save settings
        </Button>
        {state === "saved" && !dirty && (
          <span className="flex items-center gap-1 text-sm text-emerald-700">
            <Check className="size-4" /> Saved
          </span>
        )}
      </div>
    </form>
  );
}
