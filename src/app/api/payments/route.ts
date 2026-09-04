import { prisma } from "@/lib/prisma";
import { requireOrg, assertSameOrg } from "@/lib/require-org";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");

  const payments = await prisma.payment.findMany({
    where: { organizationId, ...(period && { period }) },
    include: { student: { select: { id: true, user: { select: { name: true } } } } },
    orderBy: [{ period: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { studentId, period, amount, method, paid, dueDate } = await req.json();
  if (!studentId || !period || !amount) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const student = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { organizationId: true } });
  if (!assertSameOrg(student?.organizationId, organizationId)) {
    return NextResponse.json({ error: "Alumno inválido" }, { status: 400 });
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
      organizationId,
    },
    include: { student: { select: { id: true, user: { select: { name: true } } } } },
  });

  return NextResponse.json(payment);
}
