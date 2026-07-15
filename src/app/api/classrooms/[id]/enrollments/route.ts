import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: classroomId } = await params;
  const { studentId, status } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Falta el alumno" }, { status: 400 });

  try {
    const enrollment = await prisma.enrollment.create({
      data: { studentId, classroomId, status: status ?? "ACTIVA" },
    });
    return NextResponse.json(enrollment);
  } catch {
    return NextResponse.json({ error: "El alumno ya está inscripto en esta aula" }, { status: 409 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: classroomId } = await params;
  const { enrollmentId, status } = await req.json();
  if (!enrollmentId || !status) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.update({
    where: { id: enrollmentId, classroomId },
    data: { status },
  });
  return NextResponse.json(enrollment);
}
