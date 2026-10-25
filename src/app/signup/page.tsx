import Link from "next/link";
import { redirect } from "next/navigation";
import { MailCheck } from "lucide-react";
import { AuthForm, AuthShell } from "@/components/AuthForm";
import { Logo } from "@/components/brand";
import { getCoach } from "@/lib/auth";
import { read } from "@/lib/db";

export const metadata = { title: "Create your account" };

export default async function Signup({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  if (await getCoach()) redirect("/dashboard");
  const { invite: token } = await searchParams;
  const d = await read();
  const invite = token ? d.invites.find((i) => i.token === token) : undefined;
  const inviteValid = !!invite && !invite.usedAt && new Date(invite.expiresAt).getTime() > Date.now();
  const open = d.settings.signupMode === "open";

  return (
    <>
      <div className="absolute top-5 left-6 z-10">
        <Logo />
      </div>
      {token && !inviteValid ? (
        <AuthShell title="Invite expired" subtitle="This invite link has already been used or has expired.">
          <p className="text-sm text-muted">Ask the administrator for a new invite link.</p>
          <Link href="/login" className="mt-6 block text-center text-sm font-medium text-violet-700 hover:underline">
            Already have an account? Sign in
          </Link>
        </AuthShell>
      ) : !inviteValid && !open ? (
        <AuthShell title="Invite only" subtitle="New coach accounts are created by invitation.">
          <div className="flex gap-3 rounded-2xl bg-violet-50 p-4 text-sm text-violet-900">
            <MailCheck className="mt-0.5 size-4 shrink-0" />
            New coaches join by application. Tell us about your coaching and we&apos;ll send you a personal sign-up link.
          </div>
          <Link href="/apply" className="mt-5 flex h-11 items-center justify-center rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700">
            Apply for access
          </Link>
          <Link href="/login" className="mt-6 block text-center text-sm font-medium text-violet-700 hover:underline">
            Already have an account? Sign in
          </Link>
        </AuthShell>
      ) : (
        <AuthShell
          title={inviteValid ? "You're invited 🎉" : "Clone your coaching mind"}
          subtitle={inviteValid ? "Create your account to start building your AI mind." : "Create an account to build your first AI mind."}
        >
          <AuthForm mode="signup" invite={inviteValid ? token : undefined} inviteEmail={invite?.email || undefined} />
        </AuthShell>
      )}
    </>
  );
}
