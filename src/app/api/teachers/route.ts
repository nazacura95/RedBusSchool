import { prisma, PUBLIC_USER_SELECT } from "@/lib/prisma";
import { requireOrg } from "@/lib/require-org";
import { generatePendingPasswordHash } from "@/lib/pending-account";
import { NextResponse } from "next/server";

export async function GET() {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const teachers = await prisma.teacherProfile.findMany({
    where: { organizationId },
    include: {
      user: { select: PUBLIC_USER_SELECT },
      classrooms: { orderBy: { name: "asc" } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(teachers);
}

export async function POST(req: Request) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
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
        // Prisma no acepta el escalar organizationId junto con un `user: { create }` anidado
        // en el mismo create() — hay que usar la forma de relación (connect) para TeacherProfile.
        organization: { connect: { id: organizationId } },
        user: { create: { name, email, passwordHash, roles: ["DOCENTE"], enabled: false, organizationId } },
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
