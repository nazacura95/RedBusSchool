import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

// true si la clave todavía tiene intentos disponibles en la ventana actual (y lo consume).
export async function checkRateLimit(key: string): Promise<boolean> {
  const now = new Date();
  const record = await prisma.loginAttempt.findUnique({ where: { key } });

  if (!record || now.getTime() - record.windowStart.getTime() > WINDOW_MS) {
    await prisma.loginAttempt.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) return false;

  await prisma.loginAttempt.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}

export async function clearRateLimit(key: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key } });
}
