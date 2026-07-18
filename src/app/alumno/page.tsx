import { BookOpen, Wallet, Award, Check } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { PaymentStatusBadge, EnrollmentStatusBadge } from "@/components/ui/badge";
import { nextClassDate, formatNextClass } from "@/lib/schedule";
import { TareasSection } from "./tareas-section";

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

  const assignments = profile
    ? await prisma.assignment.findMany({
        where: { classroomId: { in: profile.enrollments.map((e) => e.classroomId) } },
        include: {
          classroom: { select: { name: true } },
          submissions: { where: { studentId: profile.id } },
        },
        orderBy: { dueDate: "asc" },
      })
    : [];

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title="Panel del alumno">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Hola, {session!.user.name}</h2>
        <p className="text-sm text-neutral-500">Este es el resumen de tu actividad en el instituto.</p>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold text-neutral-900">Mis aulas</h3>
        {!profile || profile.enrollments.length === 0 ? (
          <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-500">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Sin aulas</p>
              <p className="text-sm text-neutral-600">Todavía no estás inscripto en ninguna aula.</p>
            </div>
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Aula</Th>
                <Th>Nivel</Th>
                <Th>Docente</Th>
                <Th>Próxima clase</Th>
                <Th>Estado</Th>
              </Tr>
            </Thead>
            <Tbody>
              {profile.enrollments.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-medium text-neutral-900">{e.classroom.name}</Td>
                  <Td>{e.classroom.level}</Td>
                  <Td>{e.classroom.teacher.user.name}</Td>
                  <Td>{formatNextClass(nextClassDate(e.classroom.dayOfWeek, e.classroom.startTime))}</Td>
                  <Td>
                    <EnrollmentStatusBadge status={e.status} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {profile && profile.enrollments.length > 0 && (() => {
        const sorted = [...profile.enrollments].sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        );
        const completedCount = sorted.filter((e) => e.status === "FINALIZADA").length;
        const pct = Math.round((completedCount / sorted.length) * 100);
        return (
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900">Tu progreso</h3>
              <span className="text-sm text-neutral-500">
                {completedCount} de {sorted.length} niveles completados
              </span>
            </div>
            <div className="mb-6 h-2 rounded-full bg-neutral-100">
              <div className="h-2 rounded-full bg-success-500 transition-[width]" style={{ width: `${pct}%` }} />
            </div>
            <ol className="space-y-4">
              {sorted.map((e, i) => (
                <li key={e.id} className="relative flex items-start gap-3 pb-1">
                  {i < sorted.length - 1 && (
                    <span
                      className={`absolute left-3 top-6 h-full w-0.5 -translate-x-1/2 ${
                        e.status === "FINALIZADA" ? "bg-success-500" : "bg-neutral-200"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      e.status === "FINALIZADA"
                        ? "bg-success-500 text-white"
                        : e.status === "ACTIVA"
                          ? "bg-primary-500 text-white"
                          : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {e.status === "FINALIZADA" ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  <div>
                    <p className="font-medium text-neutral-900">{e.classroom.level}</p>
                    <p className="text-xs text-neutral-500">
                      {e.status === "FINALIZADA" ? "Completado" : e.status === "ACTIVA" ? "En curso" : "Pausado"} ·{" "}
                      {e.classroom.name}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        );
      })()}

      <Card>
        <h3 className="mb-4 font-semibold text-neutral-900">Últimos pagos</h3>
        {!profile || profile.payments.length === 0 ? (
          <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-500">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Sin pagos</p>
              <p className="text-sm text-neutral-600">Sin pagos registrados.</p>
            </div>
          </div>
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
                  <Td className="tabular-nums">${p.amount.toString()}</Td>
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
          <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-500">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Sin certificados</p>
              <p className="text-sm text-neutral-600">Sin certificados emitidos todavía.</p>
            </div>
          </div>
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

      <TareasSection
        initialAssignments={assignments.map((a) => ({
          ...a,
          dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        }))}
      />
    </AppShell>
  );
}
