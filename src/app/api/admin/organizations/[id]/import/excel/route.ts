import * as XLSX from "xlsx";
import { requirePlatformAdmin } from "@/lib/require-org";
import { validateRows, type RosterRow } from "@/lib/roster-import";
import { NextResponse } from "next/server";

// Columnas esperadas de la plantilla (en cualquier orden, no case-sensitive): Nombre, DNI,
// Teléfono, Email (opcional), Aula/Nivel. Parseo 100% determinístico, sin IA — no hay riesgo de
// que se invente un dato, a diferencia del camino de Word/PDF (ver /import/document).
const COLUMN_ALIASES: Record<keyof RosterRow, string[]> = {
  name: ["nombre", "alumno", "name"],
  dni: ["dni", "documento"],
  phone: ["telefono", "teléfono", "celular", "phone"],
  email: ["email", "mail", "correo"],
  classroomName: ["aula", "nivel", "curso", "classroom"],
};

function normalizeHeader(h: string): string {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function findColumn(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.includes(normalizeHeader(h)));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requirePlatformAdmin();
  if (response) return response;
  await params; // organizationId no hace falta para parsear, solo para confirm

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1, defval: "" }) as unknown[][];

  if (raw.length < 2) {
    return NextResponse.json({ error: "El archivo no tiene filas de datos" }, { status: 400 });
  }

  const headers = raw[0].map((h) => String(h));
  const columns = {
    name: findColumn(headers, COLUMN_ALIASES.name),
    dni: findColumn(headers, COLUMN_ALIASES.dni),
    phone: findColumn(headers, COLUMN_ALIASES.phone),
    email: findColumn(headers, COLUMN_ALIASES.email),
    classroomName: findColumn(headers, COLUMN_ALIASES.classroomName),
  };

  const missing = (["name", "dni", "phone", "classroomName"] as const).filter((k) => columns[k] === -1);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Faltan columnas en la plantilla: ${missing.join(", ")}. Encabezados encontrados: ${headers.join(", ")}` },
      { status: 400 },
    );
  }

  const rows: RosterRow[] = raw
    .slice(1)
    .filter((r) => r.some((cell) => String(cell).trim() !== ""))
    .map((r) => ({
      name: String(r[columns.name] ?? "").trim(),
      dni: String(r[columns.dni] ?? "").trim(),
      phone: String(r[columns.phone] ?? "").trim(),
      email: columns.email !== -1 ? String(r[columns.email] ?? "").trim() || undefined : undefined,
      classroomName: String(r[columns.classroomName] ?? "").trim(),
    }));

  return NextResponse.json({ rows: validateRows(rows) });
}
