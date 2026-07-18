import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const classroom = await prisma.classroom.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      level: true,
      teacher: { select: { user: { select: { name: true } } } },
      enrollments: {
        select: {
          id: true,
          status: true,
          student: { select: { id: true, dni: true, user: { select: { name: true } } } },
        },
      },
    },
  });

  if (!classroom) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(classroom);
}
