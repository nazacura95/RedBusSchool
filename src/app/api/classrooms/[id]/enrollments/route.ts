import { prisma } from "@/lib/prisma";
import { requireOrg, assertSameOrg } from "@/lib/require-org";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { id: classroomId } = await params;
  const { studentId, status } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Falta el alumno" }, { status: 400 });

  const [classroom, student] = await Promise.all([
    prisma.classroom.findUnique({ where: { id: classroomId }, select: { organizationId: true } }),
    prisma.studentProfile.findUnique({ where: { id: studentId }, select: { organizationId: true } }),
  ]);
  if (!assertSameOrg(classroom?.organizationId, organizationId) || !assertSameOrg(student?.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

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
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { id: classroomId } = await params;
  const { enrollmentId, status } = await req.json();
  if (!enrollmentId || !status) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { organizationId: true } });
  if (!assertSameOrg(classroom?.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
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
