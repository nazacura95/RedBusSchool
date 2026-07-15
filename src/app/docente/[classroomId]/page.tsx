import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { EnrollmentStatusBadge } from "@/components/ui/badge";
import { MaterialsPanel } from "./materials-panel";
import { AssignmentsPanel } from "./assignments-panel";

export default async function DocenteClassroomPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      teacher: true,
      enrollments: { include: { student: { include: { user: true } } }, orderBy: { startDate: "asc" } },
      materials: { orderBy: { createdAt: "desc" } },
      assignments: { include: { submissions: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!classroom || classroom.teacher.userId !== userId) notFound();

  const activeStudents = classroom.enrollments.filter((e) => e.status === "ACTIVA").length;

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title={classroom.name}>
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">{classroom.name}</h2>
        <p className="text-sm text-neutral-500">{classroom.level}</p>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold text-neutral-900">Alumnos</h3>
        {classroom.enrollments.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay alumnos inscriptos.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Nombre</Th>
                <Th>DNI</Th>
                <Th>Estado</Th>
              </Tr>
            </Thead>
            <Tbody>
              {classroom.enrollments.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-medium text-neutral-900">{e.student.user.name}</Td>
                  <Td>{e.student.dni ?? "—"}</Td>
                  <Td>
                    <EnrollmentStatusBadge status={e.status} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <MaterialsPanel classroomId={classroom.id} initialMaterials={classroom.materials} />

      <AssignmentsPanel
        classroomId={classroom.id}
        initialAssignments={classroom.assignments.map((a) => ({
          ...a,
          dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        }))}
        totalActiveStudents={activeStudents}
      />
    </AppShell>
  );
}
