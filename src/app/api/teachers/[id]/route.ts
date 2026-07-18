import { prisma, PUBLIC_USER_SELECT } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { toggleAccountEnabled } from "@/lib/pending-account";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id },
    include: {
      user: { select: PUBLIC_USER_SELECT },
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const { enabled } = await req.json();
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const result = await toggleAccountEnabled(
    () => prisma.teacherProfile.findUnique({ where: { id }, include: { user: true } }),
    enabled,
  );
  if (!result) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(result);
}
