import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { PagosView } from "./pagos-view";

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

// últimos 6 períodos "YYYY-MM", del más viejo al más nuevo (para el gráfico).
function lastPeriods(n: number) {
  const periods: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(d.toISOString().slice(0, 7));
  }
  return periods;
}

export default async function PagosPage() {
  const session = await auth();
  const period = currentPeriod();
  const periods = lastPeriods(6);

  const [students, grouped, historicoPagado] = await Promise.all([
    prisma.studentProfile.findMany({
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.payment.groupBy({
      by: ["period", "status"],
      where: { period: { in: periods } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAGADO" },
      _sum: { amount: true },
    }),
  ]);

  const trend = periods.map((p) => {
    const row = { period: p, pagado: 0, pendiente: 0, vencido: 0 };
    for (const g of grouped) {
      if (g.period !== p) continue;
      const amount = Number(g._sum.amount ?? 0);
      if (g.status === "PAGADO") row.pagado = amount;
      if (g.status === "PENDIENTE") row.pendiente = amount;
      if (g.status === "VENCIDO") row.vencido = amount;
    }
    return row;
  });

  const currentMonth = trend[trend.length - 1];

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title="Pagos">
      <PagosView
        students={students.map((s) => ({ id: s.id, name: s.user.name }))}
        currentPeriod={period}
        currentMonth={currentMonth}
        historicoPagado={Number(historicoPagado._sum.amount ?? 0)}
        trend={trend}
      />
    </AppShell>
  );
}
