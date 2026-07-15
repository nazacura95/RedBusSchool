import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";

export default async function DirectivoDashboard() {
  const session = await auth();

  const [totalAlumnos, totalDocentes, totalAulas, pagosPendientes] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.classroom.count(),
    prisma.payment.count({ where: { status: "PENDIENTE" } }),
  ]);

  const stats = [
    { label: "Alumnos", value: totalAlumnos },
    { label: "Docentes", value: totalDocentes },
    { label: "Aulas", value: totalAulas },
    { label: "Cuotas pendientes", value: pagosPendientes },
  ];

  return (
    <div>
      <Header title="Panel directivo" name={session!.user.name} />
      <main className="mx-auto max-w-4xl p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded border bg-white p-4">
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="text-sm text-neutral-500">{s.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
