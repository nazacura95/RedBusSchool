import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/require-org";
import { NextResponse } from "next/server";

export async function GET() {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const classrooms = await prisma.classroom.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      level: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      teacher: { select: { user: { select: { name: true } } } },
      enrollments: { where: { status: "ACTIVA" }, select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(classrooms);
}

export async function POST(req: Request) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { name, level, teacherId, dayOfWeek, startTime, endTime } = await req.json();
  if (!name || !level || !teacherId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  // el docente tiene que ser de la misma organización, si no el aula queda "huérfana" con un
  // docente que la dirección no puede ver ni administrar.
  const teacher = await prisma.teacherProfile.findUnique({ where: { id: teacherId }, select: { organizationId: true } });
  if (!teacher || teacher.organizationId !== organizationId) {
    return NextResponse.json({ error: "Docente inválido" }, { status: 400 });
  }

  const classroom = await prisma.classroom.create({
    data: {
      name,
      level,
      teacherId,
      organizationId,
      dayOfWeek: Array.isArray(dayOfWeek) ? dayOfWeek : [],
      startTime: startTime || null,
      endTime: endTime || null,
    },
  });
  return NextResponse.json(classroom);
}
