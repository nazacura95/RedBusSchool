import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { requirePlatformAdmin } from "@/lib/require-org";
import { validateRows, type RosterRow } from "@/lib/roster-import";
import { NextResponse } from "next/server";

// Camino "libre" del wizard: Word/PDF sin plantilla, extracción asistida por Claude. A
// diferencia de /import/excel (determinístico), acá SÍ hay riesgo de que un dato se lea mal —
// por eso esto nunca escribe nada en la base directo, siempre devuelve a la misma pantalla de
// revisión editable que el camino de Excel (ver src/lib/roster-import.ts).
const EXTRACT_TOOL = {
  name: "cargar_planilla",
  description: "Vuelca la lista de alumnos encontrada en el documento en filas estructuradas.",
  input_schema: {
    type: "object" as const,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nombre completo del alumno" },
            dni: { type: "string", description: "DNI, solo dígitos si es posible" },
            phone: { type: "string", description: "Teléfono de contacto" },
            email: { type: "string", description: "Email, si figura" },
            classroomName: { type: "string", description: "Nivel, curso o aula a la que pertenece" },
          },
          required: ["name", "dni", "phone", "classroomName"],
        },
      },
    },
    required: ["rows"],
  },
};

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requirePlatformAdmin();
  if (response) return response;
  await params;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Falta configurar ANTHROPIC_API_KEY — este camino de carga (Word/PDF) todavía no está disponible." },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx");

  if (!isPdf && !isDocx) {
    return NextResponse.json({ error: "Solo se aceptan archivos .pdf o .docx acá" }, { status: 400 });
  }

  const content: Anthropic.MessageParam["content"] = isPdf
    ? [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") } },
        { type: "text", text: "Extraé la lista de alumnos de este documento con la herramienta cargar_planilla." },
      ]
    : [
        {
          type: "text",
          text:
            `Extraé la lista de alumnos del siguiente texto (viene de un Word) con la herramienta cargar_planilla.\n\n---\n${await extractTextFromDocx(
              buffer,
            )}`,
        },
      ];

  let message;
  try {
    message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
      messages: [{ role: "user", content }],
    });
  } catch (err) {
    console.error("Error llamando a Claude para extraer el documento", err);
    return NextResponse.json({ error: "No se pudo leer el documento con IA. Probá con el Excel de plantilla." }, { status: 502 });
  }

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json({ error: "La IA no devolvió filas reconocibles de este documento." }, { status: 502 });
  }

  const rows = ((toolUse.input as { rows: RosterRow[] }).rows ?? []).map((r) => ({
    name: r.name ?? "",
    dni: r.dni ?? "",
    phone: r.phone ?? "",
    email: r.email || undefined,
    classroomName: r.classroomName ?? "",
  }));

  return NextResponse.json({ rows: validateRows(rows) });
}
