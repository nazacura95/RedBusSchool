import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/require-org";
import { toCsv, csvResponse } from "@/lib/csv";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { type } = await params;

  if (type === "alumnos") {
    const students = await prisma.studentProfile.findMany({
      where: { organizationId },
      include: { user: true, enrollments: { include: { classroom: true } } },
      orderBy: { user: { name: "asc" } },
    });
    const csv = toCsv(
      students.map((s) => ({
        nombre: s.user.name,
        email: s.user.email,
        dni: s.dni ?? "",
        telefono: s.phone ?? "",
        aulas: s.enrollments.map((e) => e.classroom.name).join(" / "),
        alta: s.createdAt.toISOString().slice(0, 10),
      })),
      [
        { key: "nombre", header: "Nombre" },
        { key: "email", header: "Email" },
        { key: "dni", header: "DNI" },
        { key: "telefono", header: "Teléfono" },
        { key: "aulas", header: "Aulas" },
        { key: "alta", header: "Fecha de alta" },
      ]
    );
    return csvResponse(csv, "alumnos.csv");
  }

  if (type === "pagos") {
    const payments = await prisma.payment.findMany({
      where: { organizationId },
      include: { student: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
    const csv = toCsv(
      payments.map((p) => ({
        alumno: p.student.user.name,
        periodo: p.period,
        monto: p.amount.toString(),
        estado: p.status,
        metodo: p.method ?? "",
        pagadoEl: p.paidAt ? p.paidAt.toISOString().slice(0, 10) : "",
      })),
      [
        { key: "alumno", header: "Alumno" },
        { key: "periodo", header: "Período" },
        { key: "monto", header: "Monto" },
        { key: "estado", header: "Estado" },
        { key: "metodo", header: "Método" },
        { key: "pagadoEl", header: "Pagado el" },
      ]
    );
    return csvResponse(csv, "pagos.csv");
  }

  if (type === "docentes") {
    const teachers = await prisma.teacherProfile.findMany({
      where: { organizationId },
      include: { user: true, classrooms: true },
      orderBy: { user: { name: "asc" } },
    });
    const csv = toCsv(
      teachers.map((t) => ({
        nombre: t.user.name,
        email: t.user.email,
        telefono: t.phone ?? "",
        tarifaHora: t.hourlyRate?.toString() ?? "",
        aulas: t.classrooms.map((c) => c.name).join(" / "),
      })),
      [
        { key: "nombre", header: "Nombre" },
        { key: "email", header: "Email" },
        { key: "telefono", header: "Teléfono" },
        { key: "tarifaHora", header: "Tarifa por hora" },
        { key: "aulas", header: "Aulas a cargo" },
      ]
    );
    return csvResponse(csv, "docentes.csv");
  }

  if (type === "aulas") {
    const classrooms = await prisma.classroom.findMany({
      where: { organizationId },
      include: { teacher: { include: { user: true } }, enrollments: true },
      orderBy: { name: "asc" },
    });
    const csv = toCsv(
      classrooms.map((c) => ({
        nombre: c.name,
        nivel: c.level,
        docente: c.teacher.user.name,
        alumnos: c.enrollments.length,
      })),
      [
        { key: "nombre", header: "Aula" },
        { key: "nivel", header: "Nivel" },
        { key: "docente", header: "Docente" },
        { key: "alumnos", header: "Alumnos inscriptos" },
      ]
    );
    return csvResponse(csv, "aulas.csv");
  }

  if (type === "gastos") {
    const expenses = await prisma.expense.findMany({ where: { organizationId }, orderBy: { date: "desc" } });
    const csv = toCsv(
      expenses.map((e) => ({
        fecha: e.date.toISOString().slice(0, 10),
        categoria: e.category,
        descripcion: e.description ?? "",
        monto: e.amount.toString(),
      })),
      [
        { key: "fecha", header: "Fecha" },
        { key: "categoria", header: "Categoría" },
        { key: "descripcion", header: "Descripción" },
        { key: "monto", header: "Monto" },
      ]
    );
    return csvResponse(csv, "gastos.csv");
  }

  return NextResponse.json({ error: "Tipo de reporte inválido" }, { status: 400 });
}
