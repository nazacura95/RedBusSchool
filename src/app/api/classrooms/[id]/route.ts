import { prisma } from "@/lib/prisma";
import { requireOrg, assertSameOrg } from "@/lib/require-org";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const classroom = await prisma.classroom.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      level: true,
      organizationId: true,
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

  if (!classroom || !assertSameOrg(classroom.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  const { id: classroomId, name, level, teacher, enrollments } = classroom;
  return NextResponse.json({ id: classroomId, name, level, teacher, enrollments });
}
