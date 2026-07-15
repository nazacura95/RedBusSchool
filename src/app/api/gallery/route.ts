import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const caption = (form.get("caption") as string | null) ?? undefined;
  if (!file) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });

  const blob = await put(`gallery/${Date.now()}-${file.name}`, file, { access: "public" });
  const image = await prisma.siteImage.create({ data: { url: blob.url, caption } });

  return NextResponse.json(image);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await req.json();
  const image = await prisma.siteImage.delete({ where: { id } });
  await del(image.url);

  return NextResponse.json({ ok: true });
}
