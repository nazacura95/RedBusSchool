import { prisma, PUBLIC_USER_SELECT } from "@/lib/prisma";
import { requireOrg } from "@/lib/require-org";
import { generatePendingPasswordHash } from "@/lib/pending-account";
import { NextResponse } from "next/server";

export async function GET() {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const students = await prisma.studentProfile.findMany({
    where: { organizationId },
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
  const { organizationId, response } = await requireOrg("DIRECTIVO");
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
        // Prisma no acepta el escalar organizationId junto con un `user: { create }` anidado
        // en el mismo create() — hay que usar la forma de relación (connect) para StudentProfile.
        organization: { connect: { id: organizationId } },
        user: { create: { name, email, passwordHash, roles: ["ALUMNO"], enabled: false, organizationId } },
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
