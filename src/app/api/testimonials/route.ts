import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { quote, author } = await req.json();
  if (!quote?.trim() || !author?.trim()) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const testimonial = await prisma.testimonial.create({
    data: { quote: quote.trim(), author: author.trim() },
  });

  return NextResponse.json(testimonial);
}

export async function DELETE(req: Request) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { id } = await req.json();
  await prisma.testimonial.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
