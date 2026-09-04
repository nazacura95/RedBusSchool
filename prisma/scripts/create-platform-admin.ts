import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Única forma de crear una cuenta de plataforma (isPlatformAdmin) — nunca desde un formulario
// público, a propósito (el onboarding de organizaciones nuevas queda detrás de esta cuenta).
// Uso:
//   PLATFORM_ADMIN_EMAIL=vos@bedel.com.ar PLATFORM_ADMIN_PASSWORD=... PLATFORM_ADMIN_NAME="Nazareno Cura" \
//     npx tsx prisma/scripts/create-platform-admin.ts
async function main() {
  const email = process.env.PLATFORM_ADMIN_EMAIL;
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  const name = process.env.PLATFORM_ADMIN_NAME ?? "Admin Bedel";

  if (!email || !password) {
    throw new Error("Faltan PLATFORM_ADMIN_EMAIL y/o PLATFORM_ADMIN_PASSWORD en el entorno.");
  }
  if (password.length < 8) {
    throw new Error("PLATFORM_ADMIN_PASSWORD debe tener al menos 8 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name, isPlatformAdmin: true, enabled: true, roles: [] },
    create: { email, passwordHash, name, isPlatformAdmin: true, enabled: true, roles: [] },
  });

  console.log(`Cuenta de plataforma lista: ${user.email} (id ${user.id}). Entrar por /login y va a redirigir a /admin.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
