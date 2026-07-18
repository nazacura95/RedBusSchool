import { prisma, PUBLIC_USER_SELECT } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { generatePendingPasswordHash } from "@/lib/pending-account";
import { NextResponse } from "next/server";

export async function GET() {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const teachers = await prisma.teacherProfile.findMany({
    include: {
      user: { select: PUBLIC_USER_SELECT },
      classrooms: { orderBy: { name: "asc" } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(teachers);
}

export async function POST(req: Request) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { name, email, dni, phone, address, hourlyRate } = await req.json();
  if (!name || !email || !dni || !phone) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const passwordHash = await generatePendingPasswordHash();

  try {
    const teacher = await prisma.teacherProfile.create({
      data: {
        dni,
        phone,
        address: address || null,
        hourlyRate: hourlyRate ? hourlyRate : null,
        user: { create: { name, email, passwordHash, roles: ["DOCENTE"], enabled: false } },
      },
      include: { user: { select: PUBLIC_USER_SELECT } },
    });
    return NextResponse.json(teacher);
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe un docente con ese email o DNI" }, { status: 400 });
    }
    throw err;
  }
}
