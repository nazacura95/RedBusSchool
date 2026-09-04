import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/require-org";
import { generatePendingPasswordHash } from "@/lib/pending-account";
import type { ReviewRow } from "@/lib/roster-import";
import { NextResponse } from "next/server";

// Último paso del wizard: guarda lo que haya quedado en la tabla de revisión (venga de Excel o
// de la extracción con IA, no importa) — nunca lo que devolvió el parseo/la IA directamente, así
// que un dato corregido a mano en la revisión es siempre lo que termina en la base.
// Fila por fila (no una sola transacción): si una fila falla (DNI repetido, etc.) no se pierde
// el resto del lote, y el resultado le dice al operador exactamente cuáles entraron y cuáles no.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requirePlatformAdmin();
  if (response) return response;

  const { id: organizationId } = await params;
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { rows } = (await req.json()) as { rows: ReviewRow[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No hay filas para guardar" }, { status: 400 });
  }

  // las aulas que no existan todavía se crean sobre la marcha, asignadas provisoriamente al
  // director (siempre tiene un TeacherProfile, ver /api/admin/organizations) — se reasignan
  // como cualquier otra aula desde /directivo/aulas una vez que haya más docentes cargados.
  const ownerTeacher = await prisma.teacherProfile.findFirst({
    where: { organizationId, user: { roles: { has: "DIRECTIVO" } } },
    select: { id: true },
  });
  if (!ownerTeacher) {
    return NextResponse.json({ error: "El instituto no tiene un docente para asignar aulas nuevas" }, { status: 400 });
  }

  const classroomCache = new Map<string, string>(); // nombre de nivel -> classroomId
  const results: { row: number; ok: boolean; error?: string }[] = [];

  for (const row of rows) {
    try {
      if (!row.name?.trim() || !row.dni?.trim() || !row.phone?.trim() || !row.classroomName?.trim()) {
        throw new Error("Faltan datos obligatorios");
      }

      const levelKey = row.classroomName.trim();
      let classroomId = classroomCache.get(levelKey);
      if (!classroomId) {
        // mismo criterio que prisma/seed.ts: Classroom.name sigue siendo único GLOBAL hasta la
        // migración B, así que hay que namespacear con el slug para no chocar con otra org.
        const classroomName = `${levelKey} (${org.slug})`;
        const classroom = await prisma.classroom.upsert({
          where: { name: classroomName },
          update: { organizationId },
          create: { name: classroomName, level: levelKey, teacherId: ownerTeacher.id, organizationId },
        });
        classroomId = classroom.id;
        classroomCache.set(levelKey, classroomId);
      }

      const email = row.email?.trim() || `${row.dni.trim().replace(/\D/g, "")}@${org.slug}.alumnos.bedel`;
      const passwordHash = await generatePendingPasswordHash();

      const student = await prisma.studentProfile.create({
        data: {
          dni: row.dni.trim(),
          phone: row.phone.trim(),
          organization: { connect: { id: organizationId } },
          user: { create: { name: row.name.trim(), email, passwordHash, roles: ["ALUMNO"], enabled: false, organizationId } },
        },
      });

      await prisma.enrollment.create({ data: { studentId: student.id, classroomId, status: "ACTIVA" } });

      results.push({ row: row.rowIndex ?? -1, ok: true });
    } catch (err) {
      const message = (err as { code?: string }).code === "P2002" ? "Ya existe un alumno con ese email o DNI" : (err as Error).message;
      results.push({ row: row.rowIndex ?? -1, ok: false, error: message });
    }
  }

  return NextResponse.json({
    imported: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok),
  });
}
