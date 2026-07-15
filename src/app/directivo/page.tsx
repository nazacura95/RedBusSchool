import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { StatTile } from "@/components/ui/stat-tile";
import { Users, Briefcase, BookOpen, AlertTriangle } from "lucide-react";

export default async function DirectivoDashboard() {
  const session = await auth();

  const [totalAlumnos, totalDocentes, totalAulas, pagosPendientes] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.classroom.count(),
    prisma.payment.count({ where: { status: "PENDIENTE" } }),
  ]);

  return (
    <AppShell role="DIRECTIVO" name={session!.user.name} title="Panel de Dirección">
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
    </AppShell>
  );
}
