import { InviteManager } from "@/components/admin/InviteManager";
import { PageHeader } from "@/components/admin/parts";
import { read } from "@/lib/db";

export const metadata = { title: "Invites" };

export default async function InvitesPage() {
  const d = await read();
  const invites = [...d.invites]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((i) => ({ ...i, usedByName: d.coaches.find((c) => c.id === i.usedBy)?.name }));
  return (
    <>
      <PageHeader title="Invites" subtitle="Invite coaches to create their own account." />
      <InviteManager invites={invites} signupMode={d.settings.signupMode} />
    </>
  );
}
