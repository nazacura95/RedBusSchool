import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole("DOCENTE");
  if (response) return response;

  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { assignment: { include: { classroom: { include: { teacher: true } } } } },
  });

  if (!submission || submission.assignment.classroom.teacher.userId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { grade, feedback } = await req.json();

  const updated = await prisma.submission.update({
    where: { id },
    data: {
      grade: grade ?? null,
      feedback: feedback ?? null,
      status: "CORREGIDO",
      gradedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
