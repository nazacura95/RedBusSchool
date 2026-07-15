import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";

export default async function AlumnoDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      enrollments: { include: { classroom: { include: { teacher: { include: { user: true } } } } } },
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
      certificates: true,
    },
  });

  return (
    <div>
      <Header title="Panel del alumno" name={session!.user.name} />
      <main className="mx-auto max-w-4xl space-y-8 p-6">
        <section>
          <h2 className="mb-2 font-medium">Mis aulas</h2>
          {!profile || profile.enrollments.length === 0 ? (
            <p className="text-sm text-neutral-500">Todavía no estás inscripto en ninguna aula.</p>
          ) : (
            <ul className="space-y-2">
              {profile.enrollments.map((e) => (
                <li key={e.id} className="rounded border bg-white p-3 text-sm">
                  <span className="font-medium">{e.classroom.name}</span> — {e.classroom.level} · Docente:{" "}
                  {e.classroom.teacher.user.name} · Estado: {e.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-medium">Últimos pagos</h2>
          {!profile || profile.payments.length === 0 ? (
            <p className="text-sm text-neutral-500">Sin pagos registrados.</p>
          ) : (
            <ul className="space-y-2">
              {profile.payments.map((p) => (
                <li key={p.id} className="rounded border bg-white p-3 text-sm">
                  {p.period} — ${p.amount.toString()} — {p.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-medium">Certificados</h2>
          {!profile || profile.certificates.length === 0 ? (
            <p className="text-sm text-neutral-500">Sin certificados emitidos todavía.</p>
          ) : (
            <ul className="space-y-2">
              {profile.certificates.map((c) => (
                <li key={c.id} className="rounded border bg-white p-3 text-sm">
                  {c.title} — {c.issuedAt.toLocaleDateString("es-AR")}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
