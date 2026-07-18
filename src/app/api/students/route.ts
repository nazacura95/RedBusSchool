import { prisma, PUBLIC_USER_SELECT } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { generatePendingPasswordHash } from "@/lib/pending-account";
import { NextResponse } from "next/server";

export async function GET() {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const students = await prisma.studentProfile.findMany({
    include: {
      user: { select: PUBLIC_USER_SELECT },
      enrollments: { include: { classroom: true }, orderBy: { startDate: "desc" } },
      payments: { orderBy: { period: "desc" }, take: 1 },
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(students);
}

export async function POST(req: Request) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { name, email, dni, phone, address, birthDate } = await req.json();
  if (!name || !email || !dni || !phone) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const passwordHash = await generatePendingPasswordHash();

  try {
    const student = await prisma.studentProfile.create({
      data: {
        dni,
        phone,
        address: address || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        user: { create: { name, email, passwordHash, roles: ["ALUMNO"], enabled: false } },
      },
      include: { user: { select: PUBLIC_USER_SELECT } },
    });
    return NextResponse.json(student);
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe un alumno con ese email o DNI" }, { status: 400 });
    }
    throw err;
  }
}
