import { prisma, PUBLIC_USER_SELECT } from "@/lib/prisma";
import { requireOrg, assertSameOrg } from "@/lib/require-org";
import { toggleAccountEnabled } from "@/lib/pending-account";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
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

  if (!student || !assertSameOrg(student.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(student);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { id } = await params;
  const { enabled } = await req.json();
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const existing = await prisma.studentProfile.findUnique({
    where: { id },
    select: { organizationId: true, organization: { select: { name: true } } },
  });
  if (!assertSameOrg(existing?.organizationId, organizationId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const result = await toggleAccountEnabled(
    () => prisma.studentProfile.findUnique({ where: { id }, include: { user: true } }),
    enabled,
    existing.organization?.name ?? "tu instituto",
  );
  if (!result) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(result);
}
