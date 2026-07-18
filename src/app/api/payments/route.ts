import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");

  const payments = await prisma.payment.findMany({
    where: period ? { period } : undefined,
    include: { student: { select: { id: true, user: { select: { name: true } } } } },
    orderBy: [{ period: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { studentId, period, amount, method, paid, dueDate } = await req.json();
  if (!studentId || !period || !amount) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      studentId,
      period,
      amount,
      method: method || null,
      status: paid ? "PAGADO" : "PENDIENTE",
      paidAt: paid ? new Date() : null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: { student: { select: { id: true, user: { select: { name: true } } } } },
  });

  return NextResponse.json(payment);
}
