import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand";
import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/DashboardClient";
import { getCoach } from "@/lib/auth";

export const metadata = { title: { default: "Admin", template: "%s · Admin · Mindclone" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const coach = await getCoach();
  if (!coach) redirect("/login");
  if (coach.role !== "admin") redirect("/dashboard");
  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-white/70 p-4 backdrop-blur lg:flex">
        <div className="flex items-center gap-2 px-1">
          <Logo href="/admin" />
          <span className="rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">Admin</span>
        </div>
        <div className="mt-7">
          <AdminNav />
        </div>
        <div className="mt-auto space-y-2 border-t border-line pt-4">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted hover:bg-black/[0.04] hover:text-ink">
            <ArrowLeft className="size-4" /> My studio
          </Link>
          <div className="px-2.5 text-xs text-muted">
            Signed in as <span className="font-medium text-ink">{coach.email}</span>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo href="/admin" />
            <Link href="/dashboard" className="text-sm font-medium text-muted">
              My studio
            </Link>
          </div>
          <div className="overflow-x-auto px-2 pb-2">
            <AdminNav horizontal />
          </div>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
