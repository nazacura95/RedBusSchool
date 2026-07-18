import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

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
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { id: classroomId } = await params;
  const { enrollmentId, status } = await req.json();
  if (!enrollmentId || !status) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.update({
    where: { id: enrollmentId, classroomId },
    data: { status },
    include: { classroom: true },
  });

  // al cerrar un nivel se emite el certificado solo, sin que el directivo tenga que acordarse.
  if (status === "FINALIZADA") {
    await prisma.certificate.create({
      data: {
        studentId: enrollment.studentId,
        title: `Certificado ${enrollment.classroom.level} completo`,
      },
    });
  }

  return NextResponse.json(enrollment);
}
