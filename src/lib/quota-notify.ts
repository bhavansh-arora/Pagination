import "server-only";
import { mutate, read } from "./db";
import { sendMail } from "./mail";
import { quotaFor } from "./quota";
import { appUrl } from "./stripe";

/** Emails a coach once per month when they pass 80% and 100% of their plan's AI replies. */
export async function checkQuotaNotice(coachId: string) {
  const d = await read();
  const coach = d.coaches.find((c) => c.id === coachId);
  if (!coach) return;
  const q = quotaFor(d, coach);
  if (!q.limit) return;
  const level = q.ratio >= 1 ? 100 : q.ratio >= 0.8 ? 80 : 0;
  if (!level) return;
  const key = `${new Date().toISOString().slice(0, 7)}:${level}`;
  const [month, last] = [key.slice(0, 7), coach.quotaNotice ?? ""];
  if (last === key || (last.startsWith(month) && Number(last.split(":")[1]) >= level)) return;
  await mutate((data) => {
    const c = data.coaches.find((x) => x.id === coachId);
    if (c) c.quotaNotice = key;
  });
  const reset = q.resetsOn.toLocaleDateString(undefined, { month: "long", day: "numeric", timeZone: "UTC" });
  await sendMail(coach.email, {
    subject: level === 100 ? "Your minds have paused for this month" : "You've used 80% of your AI replies",
    heading: level === 100 ? "You've reached your monthly AI replies" : "You're at 80% of your monthly AI replies",
    paragraphs:
      level === 100
        ? [`Your ${q.plan.name} plan includes ${q.limit.toLocaleString()} AI replies a month, and they're all used. Clients see a "back soon" message until ${reset}.`, "Upgrade your plan to turn your minds back on right away."]
        : [`You've used ${q.used.toLocaleString()} of ${q.limit.toLocaleString()} AI replies on your ${q.plan.name} plan. They reset on ${reset}.`, "If you expect more conversations, upgrading now avoids any interruption for your clients."],
    button: { label: "See plans", url: `${await appUrl()}/dashboard/plan` },
  });
}
