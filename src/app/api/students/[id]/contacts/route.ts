import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

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
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await params;
  const { contactId } = await req.json();
  await prisma.emergencyContact.delete({ where: { id: contactId } });

  return NextResponse.json({ ok: true });
}
