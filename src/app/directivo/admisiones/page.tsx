import { prisma } from "@/lib/prisma";
import { getSessionOrg } from "@/lib/require-org";
import { AppShell } from "@/components/app-shell";
import { LeadsTable } from "./leads-table";

export default async function AdmisionesPage() {
  const { session, organizationId } = await getSessionOrg();

  const leads = await prisma.lead.findMany({
    where: { organizationId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <AppShell organizationId={organizationId} roles={session.user.roles} name={session.user.name} title="Admisiones">
      <LeadsTable initialLeads={leads} />
    </AppShell>
  );
}
