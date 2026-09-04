import { prisma } from "@/lib/prisma";
import { getSessionOrg } from "@/lib/require-org";
import { AppShell } from "@/components/app-shell";
import { DocentesTable } from "./docentes-table";

export default async function DocentesPage() {
  const { session, organizationId } = await getSessionOrg();

  const teachers = await prisma.teacherProfile.findMany({
    where: { organizationId },
    select: {
      id: true,
      dni: true,
      phone: true,
      hourlyRate: true,
      user: { select: { name: true, email: true } },
      classrooms: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <AppShell organizationId={organizationId} roles={session.user.roles} name={session.user.name} title="Docentes">
      <DocentesTable
        initialTeachers={teachers.map((t) => ({
          ...t,
          hourlyRate: t.hourlyRate ? Number(t.hourlyRate) : null,
        }))}
      />
    </AppShell>
  );
}
