import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { sendWhatsAppText } from "@/lib/openwa";
import { normalizePhone } from "@/lib/phone";
import { NextResponse } from "next/server";

async function assertOwner(classroomId: string, userId: string) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: { teacher: true, organization: { select: { name: true } } },
  });
  return classroom && classroom.teacher.userId === userId ? classroom : null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole("DOCENTE");
  if (response) return response;

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
  const { session, response } = await requireRole("DOCENTE");
  if (response) return response;

  const { id } = await params;
  const classroom = await assertOwner(id, session.user.id);
  if (!classroom) {
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
  const incoming = (records as { enrollmentId: string; present: boolean }[]).filter((r) => validIds.has(r.enrollmentId));

  const previous = await prisma.attendance.findMany({
    where: { date: attendanceDate, enrollmentId: { in: incoming.map((r) => r.enrollmentId) } },
    select: { enrollmentId: true, present: true },
  });
  const previousByEnrollment = new Map(previous.map((p) => [p.enrollmentId, p.present]));

  await prisma.$transaction(
    incoming.map((r) =>
      prisma.attendance.upsert({
        where: { enrollmentId_date: { enrollmentId: r.enrollmentId, date: attendanceDate } },
        update: { present: r.present },
        create: { enrollmentId: r.enrollmentId, date: attendanceDate, present: r.present },
      })
    )
  );

  // aviso por WhatsApp a los contactos de emergencia solo para ausencias recién marcadas
  // (no reenvía si el docente vuelve a guardar la misma asistencia ya cargada).
  const newlyAbsent = incoming.filter((r) => !r.present && previousByEnrollment.get(r.enrollmentId) !== false);
  if (newlyAbsent.length > 0) {
    const students = await prisma.enrollment.findMany({
      where: { id: { in: newlyAbsent.map((r) => r.enrollmentId) } },
      select: { id: true, student: { select: { user: { select: { name: true } }, contacts: true } } },
    });
    for (const e of students) {
      for (const contact of e.student.contacts) {
        sendWhatsAppText(
          normalizePhone(contact.phone),
          `Hola! Te avisamos que ${e.student.user.name} estuvo ausente hoy en ${classroom.organization?.name ?? "el instituto"}.`,
        ).catch((err) => console.error("No se pudo avisar ausencia por WhatsApp", err));
      }
    }
  }

  return NextResponse.json({ ok: true });
}
