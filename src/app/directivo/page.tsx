import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { StatTile } from "@/components/ui/stat-tile";
import { Card } from "@/components/ui/card";
import { Users, Briefcase, BookOpen, AlertTriangle } from "lucide-react";
import { AlumnosPorNivelChart, EstadoPagosChart } from "./charts";

export default async function DirectivoDashboard() {
  const session = await auth();

  const currentPeriod = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const [totalAlumnos, totalDocentes, totalAulas, pagosPendientes, aulas, pagos] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.classroom.count(),
    prisma.payment.count({ where: { status: "PENDIENTE" } }),
    prisma.classroom.findMany({
      include: { enrollments: { where: { status: "ACTIVA" } } },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      where: { period: currentPeriod },
      _count: { _all: true },
    }),
  ]);

  const porNivel = new Map<string, number>();
  for (const aula of aulas) {
    porNivel.set(aula.level, (porNivel.get(aula.level) ?? 0) + aula.enrollments.length);
  }
  const alumnosPorNivel = Array.from(porNivel, ([level, alumnos]) => ({ level, alumnos }));

  const estadoPagos = pagos.map((p) => ({ status: p.status, cantidad: p._count._all }));

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title="Panel de Dirección">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Hola, {session!.user.name}</h2>
        <p className="text-sm text-neutral-500">Resumen general del instituto.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Alumnos activos" value={totalAlumnos} icon={Users} tone="primary" />
        <StatTile label="Docentes" value={totalDocentes} icon={Briefcase} tone="accent" />
        <StatTile label="Aulas en curso" value={totalAulas} icon={BookOpen} tone="info" />
        <StatTile label="Cuotas pendientes" value={pagosPendientes} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold text-neutral-900">Alumnos por nivel</h3>
          <AlumnosPorNivelChart data={alumnosPorNivel} />
        </Card>
        <Card>
          <h3 className="font-semibold text-neutral-900">Estado de pagos ({currentPeriod})</h3>
          <EstadoPagosChart data={estadoPagos} />
        </Card>
      </div>
    </AppShell>
  );
}
