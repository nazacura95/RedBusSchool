import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// para usar en vez de `user: true` en includes — evita mandar passwordHash al cliente.
export const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  enabled: true,
  roles: true,
} as const;
