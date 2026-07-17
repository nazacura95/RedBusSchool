import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/lib/openwa";
import { normalizePhone } from "@/lib/phone";

const MISMATCH_ERROR = "No encontramos una cuenta habilitada con ese email, DNI y teléfono.";

async function getProfile(userId: string): Promise<{ dni: string | null; phone: string | null } | null> {
  const [student, teacher] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId }, select: { dni: true, phone: true } }),
    prisma.teacherProfile.findUnique({ where: { userId }, select: { dni: true, phone: true } }),
  ]);
  return student ?? teacher ?? null;
}

// activación de cuenta nueva y recuperación de contraseña son el mismo flujo: si los 3 datos
// coinciden con el legajo y el directivo habilitó la cuenta, se puede elegir contraseña.
export async function activateOrResetPassword(email: string, dni: string, phone: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.enabled) return { ok: false as const, error: MISMATCH_ERROR };

  const profile = await getProfile(user.id);
  const dniMatch = profile?.dni && profile.dni.trim() === dni.trim();
  const phoneMatch = profile?.phone && normalizePhone(profile.phone) === normalizePhone(phone);
  if (!dniMatch || !phoneMatch) return { ok: false as const, error: MISMATCH_ERROR };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { ok: true as const };
}

export async function sendWelcomeWhatsApp(name: string, email: string, phone: string) {
  const loginUrl = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/recuperar` : "https://red-bus-school.vercel.app/recuperar";
  await sendWhatsAppText(
    normalizePhone(phone),
    `¡Hola ${name}! Ya podés entrar a Redbus School of English. Andá a ${loginUrl} y con tu email (${email}), DNI y teléfono vas a poder elegir tu contraseña.`,
  );
}
