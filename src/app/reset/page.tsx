import { AuthShell } from "@/components/AuthForm";
import { Logo } from "@/components/brand";
import { ResetForm } from "@/components/PasswordForms";

export const metadata = { title: "Choose a new password" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return (
    <>
      <div className="absolute top-5 left-6 z-10">
        <Logo />
      </div>
      <AuthShell title="Choose a new password" subtitle="At least 8 characters.">
        {token ? <ResetForm token={token} /> : <p className="text-sm text-muted">This link is missing its token. Request a new reset email.</p>}
      </AuthShell>
    </>
  );
}
