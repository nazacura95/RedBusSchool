import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, assertSameOrg } from "@/lib/require-org";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Roster } from "./roster";

export default async function AulaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, organizationId } = await getSessionOrg();

  const [classroom, allStudents] = await Promise.all([
    prisma.classroom.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        level: true,
        organizationId: true,
        teacher: { select: { user: { select: { name: true } } } },
        enrollments: {
          select: {
            id: true,
            status: true,
            student: { select: { id: true, dni: true, user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.studentProfile.findMany({
      where: { organizationId },
      select: { id: true, dni: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  if (!classroom || !assertSameOrg(classroom.organizationId, organizationId)) notFound();

  return (
    <AppShell organizationId={organizationId} roles={session.user.roles} name={session.user.name} title={classroom.name}>
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-neutral-900">{classroom.name}</h2>
          <Badge tone="neutral">{classroom.level}</Badge>
        </div>
        <p className="mt-1 text-sm text-neutral-500">Docente a cargo: {classroom.teacher.user.name}</p>
      </Card>

      <Roster classroomId={classroom.id} initialEnrollments={classroom.enrollments} allStudents={allStudents} />
    </AppShell>
  );
}
