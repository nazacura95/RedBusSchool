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
  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      user: true,
      contacts: { orderBy: { createdAt: "asc" } },
      enrollments: {
        include: {
          classroom: { include: { teacher: { include: { user: true } } } },
          attendances: { select: { present: true } },
        },
        orderBy: { startDate: "desc" },
      },
      payments: { orderBy: { period: "desc" } },
      certificates: { orderBy: { issuedAt: "desc" } },
    },
  });

  if (!student) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(student);
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

  const student = await prisma.studentProfile.findUnique({ where: { id }, include: { user: true } });
  if (!student) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const user = await prisma.user.update({ where: { id: student.userId }, data: { enabled } });

  if (enabled && !student.user.enabled && student.phone) {
    sendWelcomeWhatsApp(user.name, user.email, student.phone).catch((err) =>
      console.error("No se pudo enviar bienvenida por WhatsApp", err),
    );
  }

  return NextResponse.json({ enabled: user.enabled });
}
