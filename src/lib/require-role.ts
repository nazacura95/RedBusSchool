import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import type { Session } from "next-auth";

// centraliza el chequeo `session?.user.roles.includes(ROL)` repetido en cada ruta de API.
export async function requireRole(role: Role): Promise<{ session: Session; response: null } | { session: null; response: NextResponse }> {
  const session = await auth();
  if (!session?.user.roles.includes(role)) {
    return { session: null, response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return { session, response: null };
}
