import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function assertOwner(classroomId: string, userId: string) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: { teacher: true },
  });
  return classroom && classroom.teacher.userId === userId ? classroom : null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes("DOCENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  if (!(await assertOwner(id, session.user.id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "Falta la fecha" }, { status: 400 });
  }

  const records = await prisma.attendance.findMany({
    where: { date: new Date(date), enrollment: { classroomId: id } },
    select: { enrollmentId: true, present: true },
  });

  return NextResponse.json(records);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes("DOCENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  if (!(await assertOwner(id, session.user.id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { date, records } = await req.json();
  if (!date || !Array.isArray(records)) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  // ponytail: guard against enrollmentIds from another classroom being smuggled in the body
  const enrollments = await prisma.enrollment.findMany({ where: { classroomId: id }, select: { id: true } });
  const validIds = new Set(enrollments.map((e) => e.id));
  const attendanceDate = new Date(date);

  await prisma.$transaction(
    (records as { enrollmentId: string; present: boolean }[])
      .filter((r) => validIds.has(r.enrollmentId))
      .map((r) =>
        prisma.attendance.upsert({
          where: { enrollmentId_date: { enrollmentId: r.enrollmentId, date: attendanceDate } },
          update: { present: r.present },
          create: { enrollmentId: r.enrollmentId, date: attendanceDate, present: r.present },
        })
      )
  );

  return NextResponse.json({ ok: true });
}
