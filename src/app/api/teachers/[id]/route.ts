import { prisma, PUBLIC_USER_SELECT } from "@/lib/prisma";
import { requireOrg, assertSameOrg } from "@/lib/require-org";
import { toggleAccountEnabled } from "@/lib/pending-account";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id },
    include: {
      user: { select: PUBLIC_USER_SELECT },
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

  if (!teacher || !assertSameOrg(teacher.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: teacher.id,
    dni: teacher.dni,
    phone: teacher.phone,
    address: teacher.address,
    hourlyRate: teacher.hourlyRate,
    user: teacher.user,
    payrollItems: teacher.payrollItems,
    classrooms: teacher.classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      activeCount: c._count.enrollments,
    })),
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const { enabled } = await req.json();
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const existing = await prisma.teacherProfile.findUnique({
    where: { id },
    select: { organizationId: true, organization: { select: { name: true } } },
  });
  if (!assertSameOrg(existing?.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const result = await toggleAccountEnabled(
    () => prisma.teacherProfile.findUnique({ where: { id }, include: { user: true } }),
    enabled,
    existing.organization?.name ?? "tu instituto",
  );
  if (!result) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(result);
}
