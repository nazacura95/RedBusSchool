import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

// ponytail: extension/mime → coarse label, not exhaustive, good enough for a Badge
function inferFileType(name: string, mime: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime.startsWith("image/")) return "imagen";
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg"].includes(ext)) return "audio";
  if (mime.startsWith("video/") || ["mp4", "mov", "webm"].includes(ext)) return "video";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  return ext || "archivo";
}

async function assertOwner(classroomId: string, userId: string) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: { teacher: true },
  });
  return classroom && classroom.teacher.userId === userId ? classroom : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole("DOCENTE");
  if (response) return response;

  const { id } = await params;
  if (!(await assertOwner(id, session.user.id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = (form.get("title") as string | null)?.trim();
  if (!file || !title) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const blob = await put(`materials/${id}/${Date.now()}-${file.name}`, file, { access: "public" });
  const material = await prisma.material.create({
    data: {
      classroomId: id,
      title,
      fileUrl: blob.url,
      fileType: inferFileType(file.name, file.type),
    },
  });

  return NextResponse.json(material);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole("DOCENTE");
  if (response) return response;

  const { id } = await params;
  if (!(await assertOwner(id, session.user.id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { materialId } = await req.json();
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material || material.classroomId !== id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.material.delete({ where: { id: materialId } });
  await del(material.fileUrl);

  return NextResponse.json({ ok: true });
}
