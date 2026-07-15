import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
        include: { classroom: { include: { teacher: { include: { user: true } } } } },
        orderBy: { startDate: "desc" },
      },
      payments: { orderBy: { period: "desc" } },
      certificates: { orderBy: { issuedAt: "desc" } },
    },
  });

  if (!student) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(student);
}
