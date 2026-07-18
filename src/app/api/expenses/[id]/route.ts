import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
