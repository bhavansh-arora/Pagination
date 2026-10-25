import { redirect } from "next/navigation";
import { AccountForms } from "@/components/AccountForms";
import { StudioHeader } from "@/components/StudioHeader";
import { getCoach } from "@/lib/auth";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const coach = await getCoach();
  if (!coach) redirect("/login");
  return (
    <div className="mesh min-h-dvh">
      <StudioHeader coach={coach} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1.5 text-muted">Your sign-in details.</p>
        <div className="mt-8">
          <AccountForms name={coach.name} email={coach.email} role={coach.role} createdAt={coach.createdAt} />
        </div>
      </main>
    </div>
  );
}
