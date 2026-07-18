import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

async function assertOwner(classroomId: string, userId: string) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: { teacher: true },
  });
  return classroom && classroom.teacher.userId === userId ? classroom : null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole("DOCENTE");
  if (response) return response;

  const { id } = await params;
  if (!(await assertOwner(id, session.user.id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const assignments = await prisma.assignment.findMany({
    where: { classroomId: id },
    include: { submissions: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assignments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole("DOCENTE");
  if (response) return response;

  const { id } = await params;
  if (!(await assertOwner(id, session.user.id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { title, description, dueDate } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Falta el título" }, { status: 400 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      classroomId: id,
      title: title.trim(),
      description: description?.trim() || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: { submissions: true },
  });

  return NextResponse.json(assignment);
}
