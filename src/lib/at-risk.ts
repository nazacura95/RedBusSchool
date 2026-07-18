import { prisma } from "@/lib/prisma";

export type AtRiskStudent = { studentId: string; name: string; reasons: string[] };

// cruza ausencias consecutivas + cuotas vencidas para detectar alumnos en riesgo de abandono,
// sin necesidad de scoring/ML — alcanza para el tamaño de un instituto de barrio.
export async function findAtRiskStudents(): Promise<AtRiskStudent[]> {
  const [overduePayments, activeEnrollments] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "VENCIDO" },
      distinct: ["studentId"],
      select: { studentId: true, student: { select: { user: { select: { name: true } } } } },
    }),
    prisma.enrollment.findMany({
      where: { status: "ACTIVA" },
      select: {
        studentId: true,
        student: { select: { user: { select: { name: true } } } },
        attendances: { orderBy: { date: "desc" }, take: 2, select: { present: true } },
      },
    }),
  ]);

  const atRisk = new Map<string, AtRiskStudent>();

  for (const p of overduePayments) {
    atRisk.set(p.studentId, { studentId: p.studentId, name: p.student.user.name, reasons: ["Cuota vencida"] });
  }

  for (const e of activeEnrollments) {
    if (e.attendances.length < 2 || e.attendances.some((a) => a.present)) continue;
    const existing = atRisk.get(e.studentId);
    if (existing) {
      existing.reasons.push("2+ ausencias seguidas");
    } else {
      atRisk.set(e.studentId, { studentId: e.studentId, name: e.student.user.name, reasons: ["2+ ausencias seguidas"] });
    }
  }

  return Array.from(atRisk.values());
}
