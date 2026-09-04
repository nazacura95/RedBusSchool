import { prisma } from "@/lib/prisma";
import { requireOrg, assertSameOrg } from "@/lib/require-org";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const student = await prisma.studentProfile.findUnique({ where: { id }, select: { organizationId: true } });
  if (!assertSameOrg(student?.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

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
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const { contactId } = await req.json();
  const contact = await prisma.emergencyContact.findUnique({
    where: { id: contactId },
    select: { studentId: true, student: { select: { organizationId: true } } },
  });
  if (!contact || contact.studentId !== id || !assertSameOrg(contact.student.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.emergencyContact.delete({ where: { id: contactId } });

  return NextResponse.json({ ok: true });
}
