import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const classrooms = await prisma.classroom.findMany({
    select: {
      id: true,
      name: true,
      level: true,
      teacher: { select: { user: { select: { name: true } } } },
      enrollments: { where: { status: "ACTIVA" }, select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(classrooms);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { name, level, teacherId } = await req.json();
  if (!name || !level || !teacherId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const classroom = await prisma.classroom.create({ data: { name, level, teacherId } });
  return NextResponse.json(classroom);
}
