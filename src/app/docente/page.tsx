import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";

export default async function DocenteDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId },
    include: {
      classrooms: { include: { enrollments: { where: { status: "ACTIVA" } } } },
    },
  });

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title="Panel del docente">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Hola, {session!.user.name}</h2>
        <p className="text-sm text-neutral-500">Este es el resumen de tus aulas.</p>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold text-neutral-900">Mis aulas</h3>
        {!profile || profile.classrooms.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no tenés aulas asignadas.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Aula</Th>
                <Th>Nivel</Th>
                <Th>Alumnos activos</Th>
              </Tr>
            </Thead>
            <Tbody>
              {profile.classrooms.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium text-neutral-900">{c.name}</Td>
                  <Td>{c.level}</Td>
                  <Td>{c.enrollments.length}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </AppShell>
  );
}
