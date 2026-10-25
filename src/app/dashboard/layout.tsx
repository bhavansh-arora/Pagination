import { redirect } from "next/navigation";
import { getCoach } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCoach())) redirect("/login");
  return <div className="min-h-dvh">{children}</div>;
}
