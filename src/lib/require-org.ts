import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import type { Session } from "next-auth";

// como requireRole, pero además devuelve el organizationId de la sesión — este es el único
// punto que las rutas de API deben usar para quedar aisladas por tenant. Convive con
// requireRole (no lo reemplaza) para no forzar el chequeo de org en rutas que no lo necesitan.
export async function requireOrg(
  role: Role,
): Promise<{ session: Session; organizationId: string; response: null } | { session: null; organizationId: null; response: NextResponse }> {
  const session = await auth();
  if (!session?.user.roles.includes(role)) {
    return { session: null, organizationId: null, response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return { session, organizationId: session.user.organizationId, response: null };
}

// para rutas por :id (classroomId/studentId/teacherId, etc): confirma que el recurso ya
// encontrado pertenece a la misma organización que la sesión. Devolver 404 (no 403) cuando
// da false — un 403 confirmaría que el id existe en otro instituto.
export function assertSameOrg(resourceOrgId: string | null | undefined, organizationId: string): boolean {
  return resourceOrgId === organizationId;
}

// para Server Components: misma resolución que requireOrg pero sin el corte por NextResponse
// (una página no devuelve JSON). En la práctica no debería lanzar nunca, porque proxy.ts ya
// filtró por rol antes de renderizar la página.
export async function getSessionOrg(): Promise<{ session: Session; organizationId: string }> {
  const session = await auth();
  if (!session) throw new Error("No autenticado");
  return { session, organizationId: session.user.organizationId };
}

// para /admin: cuentas operativas de Bedel, sin organización propia — no confundir con
// requireOrg, que exige justo lo contrario (un rol de instituto + organizationId).
export async function requirePlatformAdmin(): Promise<
  { session: Session; response: null } | { session: null; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user.isPlatformAdmin) {
    return { session: null, response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return { session, response: null };
}
