import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

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
