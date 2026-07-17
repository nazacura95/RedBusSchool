import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/lib/openwa";
import { normalizePhone } from "@/lib/phone";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function getProfilePhone(userId: string): Promise<string | null> {
  const [student, teacher] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId }, select: { phone: true } }),
    prisma.teacherProfile.findUnique({ where: { userId }, select: { phone: true } }),
  ]);
  return student?.phone ?? teacher?.phone ?? null;
}

export async function requestPasswordResetCode(email: string, phone: string) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  const storedPhone = user ? await getProfilePhone(user.id) : null;

  if (!user || !storedPhone || normalizePhone(storedPhone) !== normalizePhone(phone)) {
    return { ok: false as const, error: "No encontramos una cuenta con ese email y teléfono." };
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.passwordResetCode.deleteMany({ where: { userId: user.id, usedAt: null } });
  await prisma.passwordResetCode.create({
    data: { userId: user.id, codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  await sendWhatsAppText(
    normalizePhone(storedPhone),
    `Redbus School: tu código para elegir contraseña es ${code}. Vence en 10 minutos. Si no lo pediste, ignorá este mensaje.`,
  );

  return { ok: true as const };
}

export async function confirmPasswordReset(email: string, code: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return { ok: false as const, error: "Código inválido o vencido." };

  const record = await prisma.passwordResetCode.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.attempts >= MAX_ATTEMPTS) {
    return { ok: false as const, error: "Código inválido o vencido." };
  }

  const valid = await bcrypt.compare(code, record.codeHash);
  if (!valid) {
    await prisma.passwordResetCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { ok: false as const, error: "Código incorrecto." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetCode.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true as const };
}

export async function sendWelcomeWhatsApp(name: string, email: string, phone: string) {
  const loginUrl = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/recuperar` : "https://red-bus-school.vercel.app/recuperar";
  await sendWhatsAppText(
    normalizePhone(phone),
    `¡Hola ${name}! Ya sos parte de Redbus School of English. Para activar tu cuenta y elegir tu contraseña, entrá a ${loginUrl} con tu email (${email}) y tu teléfono.`,
  );
}
