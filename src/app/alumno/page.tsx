import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { PaymentStatusBadge, EnrollmentStatusBadge } from "@/components/ui/badge";

export default async function AlumnoDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      enrollments: { include: { classroom: { include: { teacher: { include: { user: true } } } } } },
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
      certificates: true,
    },
  });

  return (
    <AppShell role="ALUMNO" name={session!.user.name} title="Panel del alumno">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Hola, {session!.user.name}</h2>
        <p className="text-sm text-neutral-500">Este es el resumen de tu actividad en el instituto.</p>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold text-neutral-900">Mis aulas</h3>
        {!profile || profile.enrollments.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no estás inscripto en ninguna aula.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Aula</Th>
                <Th>Nivel</Th>
                <Th>Docente</Th>
                <Th>Estado</Th>
              </Tr>
            </Thead>
            <Tbody>
              {profile.enrollments.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-medium text-neutral-900">{e.classroom.name}</Td>
                  <Td>{e.classroom.level}</Td>
                  <Td>{e.classroom.teacher.user.name}</Td>
                  <Td>
                    <EnrollmentStatusBadge status={e.status} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold text-neutral-900">Últimos pagos</h3>
        {!profile || profile.payments.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin pagos registrados.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Período</Th>
                <Th>Monto</Th>
                <Th>Estado</Th>
              </Tr>
            </Thead>
            <Tbody>
              {profile.payments.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-medium text-neutral-900">{p.period}</Td>
                  <Td>${p.amount.toString()}</Td>
                  <Td>
                    <PaymentStatusBadge status={p.status} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold text-neutral-900">Certificados</h3>
        {!profile || profile.certificates.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin certificados emitidos todavía.</p>
        ) : (
          <ul className="space-y-2">
            {profile.certificates.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3 text-sm"
              >
                <span className="font-medium text-neutral-900">{c.title}</span>
                <span className="text-neutral-500">{c.issuedAt.toLocaleDateString("es-AR")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
