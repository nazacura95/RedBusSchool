import { prisma } from "@/lib/prisma";
import { requireOrg, assertSameOrg } from "@/lib/require-org";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const expense = await prisma.expense.findUnique({ where: { id }, select: { organizationId: true } });
  if (!assertSameOrg(expense?.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
