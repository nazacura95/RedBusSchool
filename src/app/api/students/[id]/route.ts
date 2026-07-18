import { prisma, PUBLIC_USER_SELECT } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { toggleAccountEnabled } from "@/lib/pending-account";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      user: { select: PUBLIC_USER_SELECT },
      contacts: { orderBy: { createdAt: "asc" } },
      enrollments: {
        include: {
          classroom: { include: { teacher: { include: { user: { select: PUBLIC_USER_SELECT } } } } },
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
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const { enabled } = await req.json();
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const result = await toggleAccountEnabled(
    () => prisma.studentProfile.findUnique({ where: { id }, include: { user: true } }),
    enabled,
  );
  if (!result) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(result);
}
