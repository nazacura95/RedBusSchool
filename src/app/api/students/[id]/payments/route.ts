import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: studentId } = await params;
  const { period, amount, method, paid } = await req.json();
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
    },
  });

  return NextResponse.json(payment);
}
