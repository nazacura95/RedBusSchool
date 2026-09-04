import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    roles: Role[];
    // null solo para cuentas de plataforma (isPlatformAdmin) — no pertenecen a un instituto.
    organizationId: string | null;
    isPlatformAdmin: boolean;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: Role[];
      // asumido no-nulo por requireOrg/getSessionOrg — esas rutas ya exigen un rol de
      // instituto (ALUMNO/DOCENTE/DIRECTIVO), que una cuenta de plataforma nunca tiene.
      organizationId: string;
      isPlatformAdmin: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: Role[];
    organizationId: string | null;
    isPlatformAdmin: boolean;
    enabledCheckedAt: number;
  }
}
