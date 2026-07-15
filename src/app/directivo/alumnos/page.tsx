import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { AlumnosTable } from "./alumnos-table";

export default async function AlumnosPage() {
  const session = await auth();

  const [students, classrooms] = await Promise.all([
    prisma.studentProfile.findMany({
      select: {
        id: true,
        dni: true,
        phone: true,
        user: { select: { name: true, email: true } },
        enrollments: {
          select: { status: true, classroom: { select: { id: true, name: true } } },
          orderBy: { startDate: "desc" },
        },
        payments: { select: { status: true }, orderBy: { period: "desc" }, take: 1 },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.classroom.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title="Alumnos">
      <AlumnosTable initialStudents={students} classrooms={classrooms} />
    </AppShell>
  );
}
