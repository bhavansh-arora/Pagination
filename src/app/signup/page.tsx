import { redirect } from "next/navigation";
import { AuthForm, AuthShell } from "@/components/AuthForm";
import { Logo } from "@/components/brand";
import { getCoach } from "@/lib/auth";

export const metadata = { title: "Create your account" };

export default async function Signup() {
  if (await getCoach()) redirect("/dashboard");
  return (
    <>
      <div className="absolute top-5 left-6 z-10">
        <Logo />
      </div>
      <AuthShell title="Clone your coaching mind" subtitle="Create an account to build your first AI mind.">
        <AuthForm mode="signup" />
      </AuthShell>
    </>
  );
}
