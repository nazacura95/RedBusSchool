import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { AulasList } from "./aulas-list";

export default async function AulasPage() {
  const session = await auth();

  const [classrooms, teachers] = await Promise.all([
    prisma.classroom.findMany({
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
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title="Aulas">
      <AulasList initialClassrooms={classrooms} teachers={teachers} />
    </AppShell>
  );
}
