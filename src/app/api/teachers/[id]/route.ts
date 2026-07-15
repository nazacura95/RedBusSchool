import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id },
    include: {
      user: true,
      classrooms: {
        select: {
          id: true,
          name: true,
          level: true,
          _count: { select: { enrollments: { where: { status: "ACTIVA" } } } },
        },
        orderBy: { name: "asc" },
      },
      payrollItems: { orderBy: { period: "desc" } },
    },
  });

  if (!teacher) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { classrooms, ...rest } = teacher;
  return NextResponse.json({
    ...rest,
    classrooms: classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      activeCount: c._count.enrollments,
    })),
  });
}
