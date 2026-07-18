import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { GastosView } from "./gastos-view";

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

export default async function GastosPage() {
  const session = await auth();
  const period = currentPeriod();
  const [year, month] = period.split("-").map(Number);
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));

  const [currentMonthExpenses, historicoTotal] = await Promise.all([
    prisma.expense.findMany({ where: { date: { gte: from, lt: to } } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  const totalMes = currentMonthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

  const byCategory = new Map<string, number>();
  for (const e of currentMonthExpenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));
  }
  const categoryBreakdown = Array.from(byCategory, ([category, amount]) => ({ category, amount })).sort(
    (a, b) => b.amount - a.amount,
  );

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title="Gastos">
      <GastosView
        currentPeriod={period}
        totalMes={totalMes}
        historicoTotal={Number(historicoTotal._sum.amount ?? 0)}
        categoryBreakdown={categoryBreakdown}
      />
    </AppShell>
  );
}
