import { prisma } from "@/lib/prisma";
import { requireOrg, assertSameOrg } from "@/lib/require-org";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.lead.findUnique({ where: { id }, select: { organizationId: true } });
  if (!assertSameOrg(existing?.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const { status, notes } = await req.json();

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json(lead);
}
