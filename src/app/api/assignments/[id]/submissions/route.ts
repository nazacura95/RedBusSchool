import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole("ALUMNO");
  if (response) return response;

  const { id: assignmentId } = await params;

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const enrolled = await prisma.enrollment.findUnique({
    where: { studentId_classroomId: { studentId: profile.id, classroomId: assignment.classroomId } },
  });
  if (!enrolled) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { content } = await req.json();
  const trimmed = (content as string | undefined)?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Falta el contenido de la entrega" }, { status: 400 });
  }

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: profile.id } },
  });
  if (existing?.status === "CORREGIDO") {
    return NextResponse.json({ error: "Ya fue corregida, no se puede modificar" }, { status: 409 });
  }

  const submission = await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: profile.id } },
    create: { assignmentId, studentId: profile.id, content: trimmed, status: "ENTREGADO" },
    update: { content: trimmed, status: "ENTREGADO", submittedAt: new Date() },
  });

  return NextResponse.json(submission);
}
