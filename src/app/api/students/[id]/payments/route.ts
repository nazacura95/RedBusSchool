import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { id: studentId } = await params;
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
    },
  });

  return NextResponse.json(payment);
}
