import { redirect } from "next/navigation";
import { AuthForm, AuthShell } from "@/components/AuthForm";
import { Logo } from "@/components/brand";
import { getCoach } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function Login() {
  if (await getCoach()) redirect("/dashboard");
  return (
    <>
      <div className="absolute top-5 left-6 z-10">
        <Logo />
      </div>
      <AuthShell title="Welcome back" subtitle="Sign in to manage your minds.">
        <AuthForm mode="login" />
      </AuthShell>
    </>
  );
}
