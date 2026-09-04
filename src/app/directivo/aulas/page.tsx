import { prisma } from "@/lib/prisma";
import { getSessionOrg } from "@/lib/require-org";
import { AppShell } from "@/components/app-shell";
import { AulasList } from "./aulas-list";

export default async function AulasPage() {
  const { session, organizationId } = await getSessionOrg();

  const [classrooms, teachers] = await Promise.all([
    prisma.classroom.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        level: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        teacher: { select: { user: { select: { name: true } } } },
        enrollments: { where: { status: "ACTIVA" }, select: { id: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.teacherProfile.findMany({
      where: { organizationId },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <AppShell organizationId={organizationId} roles={session.user.roles} name={session.user.name} title="Aulas">
      <AulasList initialClassrooms={classrooms} teachers={teachers} />
    </AppShell>
  );
}
