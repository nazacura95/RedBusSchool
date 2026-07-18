import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const caption = (form.get("caption") as string | null) ?? undefined;
  if (!file) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });

  const blob = await put(`gallery/${Date.now()}-${file.name}`, file, { access: "public" });
  const image = await prisma.siteImage.create({ data: { url: blob.url, caption } });

  return NextResponse.json(image);
}

export async function DELETE(req: Request) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { id } = await req.json();
  const image = await prisma.siteImage.delete({ where: { id } });
  await del(image.url);

  return NextResponse.json({ ok: true });
}
