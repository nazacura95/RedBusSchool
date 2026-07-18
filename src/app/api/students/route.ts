import bcrypt from "bcryptjs";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma, PUBLIC_USER_SELECT } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

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
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { name, email, dni, phone, address, birthDate } = await req.json();
  if (!name || !email || !dni || !phone) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  // nadie conoce esta contraseña: el alumno elige la suya en /recuperar una vez habilitado.
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

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
