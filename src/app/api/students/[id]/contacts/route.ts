import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const { name, relationship, phone, email } = await req.json();
  if (!name || !relationship || !phone) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const contact = await prisma.emergencyContact.create({
    data: { studentId: id, name, relationship, phone, email: email || null },
  });

  return NextResponse.json(contact);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  await params;
  const { contactId } = await req.json();
  await prisma.emergencyContact.delete({ where: { id: contactId } });

  return NextResponse.json({ ok: true });
}
