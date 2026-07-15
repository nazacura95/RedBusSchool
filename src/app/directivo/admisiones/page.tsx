import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { LeadsTable } from "./leads-table";

export default async function AdmisionesPage() {
  const session = await auth();

  const leads = await prisma.lead.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title="Admisiones">
      <LeadsTable initialLeads={leads} />
    </AppShell>
  );
}
