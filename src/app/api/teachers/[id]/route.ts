import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWelcomeWhatsApp } from "@/lib/password-reset";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id },
    include: {
      user: true,
      classrooms: {
        select: {
          id: true,
          name: true,
          level: true,
          _count: { select: { enrollments: { where: { status: "ACTIVA" } } } },
        },
        orderBy: { name: "asc" },
      },
      payrollItems: { orderBy: { period: "desc" } },
    },
  });

  if (!teacher) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { classrooms, ...rest } = teacher;
  return NextResponse.json({
    ...rest,
    classrooms: classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      activeCount: c._count.enrollments,
    })),
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const { enabled } = await req.json();
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const teacher = await prisma.teacherProfile.findUnique({ where: { id }, include: { user: true } });
  if (!teacher) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const user = await prisma.user.update({ where: { id: teacher.userId }, data: { enabled } });

  if (enabled && !teacher.user.enabled && teacher.phone) {
    sendWelcomeWhatsApp(user.name, user.email, teacher.phone).catch((err) =>
      console.error("No se pudo enviar bienvenida por WhatsApp", err),
    );
  }

  return NextResponse.json({ enabled: user.enabled });
}
