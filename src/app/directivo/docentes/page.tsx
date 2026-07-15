import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { DocentesTable } from "./docentes-table";

export default async function DocentesPage() {
  const session = await auth();

  const teachers = await prisma.teacherProfile.findMany({
    select: {
      id: true,
      dni: true,
      phone: true,
      hourlyRate: true,
      user: { select: { name: true, email: true } },
      classrooms: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title="Docentes">
      <DocentesTable
        initialTeachers={teachers.map((t) => ({
          ...t,
          hourlyRate: t.hourlyRate ? Number(t.hourlyRate) : null,
        }))}
      />
    </AppShell>
  );
}
