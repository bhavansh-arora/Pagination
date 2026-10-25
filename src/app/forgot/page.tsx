import Link from "next/link";
import { AuthShell } from "@/components/AuthForm";
import { Logo } from "@/components/brand";
import { ForgotForm } from "@/components/PasswordForms";
import { mailEnabled } from "@/lib/mail";

export const metadata = { title: "Forgot password" };

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const kind = (await searchParams).kind === "client" ? "client" : "coach";
  return (
    <>
      <div className="absolute top-5 left-6 z-10">
        <Logo />
      </div>
      <AuthShell title="Forgot your password?" subtitle="We'll email you a link to choose a new one.">
        {mailEnabled() ? (
          <ForgotForm kind={kind} />
        ) : (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {kind === "coach" ? "Ask the platform administrator to reset your password." : "Contact your coach and they'll get you back in."}
          </p>
        )}
        <Link href={kind === "coach" ? "/login" : "/me"} className="mt-6 block text-center text-sm font-medium text-violet-700 hover:underline">
          Back to sign in
        </Link>
      </AuthShell>
    </>
  );
}
