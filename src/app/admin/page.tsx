import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { Plus } from "lucide-react";

// Única página del sistema que lista organizaciones sin filtrar por organizationId —
// legítimo acá porque esta ruta ya está detrás de isPlatformAdmin (proxy.ts + admin/layout.tsx),
// nunca detrás de requireOrg. No copiar este patrón fuera de /admin.
export default async function AdminHomePage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { students: true, teachers: true, classrooms: true } } },
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Clientes</h1>
          <p className="text-sm text-neutral-500">Institutos dados de alta en Bedel.</p>
        </div>
        <LinkButton href="/admin/clientes/nuevo">
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </LinkButton>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-6 py-3">Instituto</th>
              <th className="px-6 py-3">Slug</th>
              <th className="px-6 py-3">Alumnos</th>
              <th className="px-6 py-3">Docentes</th>
              <th className="px-6 py-3">Aulas</th>
              <th className="px-6 py-3">Alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {organizations.map((org) => (
              <tr key={org.id}>
                <td className="px-6 py-3 font-medium text-neutral-900">
                  <Link href={`/admin/clientes/${org.id}`} className="hover:underline">
                    {org.name}
                  </Link>
                </td>
                <td className="px-6 py-3 text-neutral-500">{org.slug}</td>
                <td className="px-6 py-3">{org._count.students}</td>
                <td className="px-6 py-3">{org._count.teachers}</td>
                <td className="px-6 py-3">{org._count.classrooms}</td>
                <td className="px-6 py-3 text-neutral-500">{org.createdAt.toLocaleDateString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {organizations.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-neutral-500">Todavía no hay institutos dados de alta.</p>
        )}
      </Card>
    </>
  );
}
