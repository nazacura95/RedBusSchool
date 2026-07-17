import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWelcomeWhatsApp } from "@/lib/password-reset";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const students = await prisma.studentProfile.findMany({
    include: {
      user: true,
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

  const { name, email, password, dni, phone, address, birthDate } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const student = await prisma.studentProfile.create({
      data: {
        dni: dni || null,
        phone: phone || null,
        address: address || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        user: { create: { name, email, passwordHash, roles: ["ALUMNO"] } },
      },
      include: { user: true },
    });
    if (phone) {
      sendWelcomeWhatsApp(name, email, phone).catch((err) => console.error("No se pudo enviar bienvenida por WhatsApp", err));
    }
    return NextResponse.json(student);
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe un alumno con ese email o DNI" }, { status: 400 });
    }
    throw err;
  }
}
