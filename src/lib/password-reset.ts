import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/lib/openwa";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";

const MISMATCH_ERROR = "No encontramos una cuenta habilitada con ese email, DNI y teléfono.";
const RATE_LIMIT_ERROR = "Demasiados intentos. Probá de nuevo en 15 minutos.";

function normalizeDni(raw: string): string {
  return raw.replace(/\D/g, "");
}

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
  const normalizedEmail = email.trim().toLowerCase();

  const allowed = await checkRateLimit(`activar:${normalizedEmail}`);
  if (!allowed) return { ok: false as const, error: RATE_LIMIT_ERROR };

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.enabled) return { ok: false as const, error: MISMATCH_ERROR };

  const profile = await getProfile(user.id);
  const dniMatch = profile?.dni && normalizeDni(profile.dni) === normalizeDni(dni);
  const phoneMatch = profile?.phone && normalizePhone(profile.phone) === normalizePhone(phone);
  if (!dniMatch || !phoneMatch) return { ok: false as const, error: MISMATCH_ERROR };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await clearRateLimit(`activar:${normalizedEmail}`);

  return { ok: true as const };
}

export async function sendWelcomeWhatsApp(name: string, email: string, phone: string, orgName: string) {
  // la URL de recuperar es la misma para todos los institutos (un solo dominio, sin
  // subdominio por organización — ver decisión de arquitectura de la migración multi-tenant).
  const loginUrl = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/recuperar` : "https://bedel.com.ar/recuperar";
  await sendWhatsAppText(
    normalizePhone(phone),
    `¡Hola ${name}! Ya podés entrar a ${orgName}. Andá a ${loginUrl} y con tu email (${email}), DNI y teléfono vas a poder elegir tu contraseña.`,
  );
}
