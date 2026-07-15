import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";

export default async function DocenteDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId },
    include: {
      classrooms: { include: { enrollments: { where: { status: "ACTIVA" } } } },
    },
  });

  return (
    <div>
      <Header title="Panel del docente" name={session!.user.name} />
      <main className="mx-auto max-w-4xl space-y-8 p-6">
        <section>
          <h2 className="mb-2 font-medium">Mis aulas</h2>
          {!profile || profile.classrooms.length === 0 ? (
            <p className="text-sm text-neutral-500">Todavía no tenés aulas asignadas.</p>
          ) : (
            <ul className="space-y-2">
              {profile.classrooms.map((c) => (
                <li key={c.id} className="rounded border bg-white p-3 text-sm">
                  <span className="font-medium">{c.name}</span> — {c.level} · {c.enrollments.length} alumnos activos
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
