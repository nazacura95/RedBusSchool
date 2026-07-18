import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function GET() {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const classrooms = await prisma.classroom.findMany({
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
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { name, level, teacherId, dayOfWeek, startTime, endTime } = await req.json();
  if (!name || !level || !teacherId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const classroom = await prisma.classroom.create({
    data: {
      name,
      level,
      teacherId,
      dayOfWeek: Array.isArray(dayOfWeek) ? dayOfWeek : [],
      startTime: startTime || null,
      endTime: endTime || null,
    },
  });
  return NextResponse.json(classroom);
}
