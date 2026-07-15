import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@redbusschool.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "cambiar123";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Admin Red Bus School",
      role: "DIRECTIVO",
    },
  });

  console.log(`Usuario directivo listo: ${user.email} / contraseña: ${password}`);
}

main().finally(() => prisma.$disconnect());
