import { prisma } from "@/lib/prisma";
import { requireOrg, assertSameOrg } from "@/lib/require-org";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { id: studentId } = await params;
  const student = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { organizationId: true } });
  if (!assertSameOrg(student?.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const { period, amount, method, paid, dueDate } = await req.json();
  if (!period || !amount) {
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
      organizationId,
    },
  });

  return NextResponse.json(payment);
}
