import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWelcomeWhatsApp } from "@/lib/password-reset";

// nadie conoce esta contraseña: la persona elige la suya en /recuperar una vez habilitada.
export async function generatePendingPasswordHash() {
  return bcrypt.hash(crypto.randomUUID(), 10);
}

type ProfileWithUser = {
  userId: string;
  phone: string | null;
  user: { enabled: boolean; name: string; email: string };
};

export type ToggleResult = { enabled: boolean; whatsapp: "sent" | "failed" | "skipped" };

// usado por el PATCH de students/[id] y teachers/[id]: habilita/deshabilita la cuenta y,
// si se está habilitando por primera vez, dispara el WhatsApp de bienvenida. Se espera el envío
// (no fire-and-forget) para poder avisarle al directivo en el panel si no llegó, en vez de que
// crea que se mandó y la persona nunca reciba el link de activación.
export async function toggleAccountEnabled(
  findProfile: () => Promise<ProfileWithUser | null>,
  enabled: boolean,
  orgName: string,
): Promise<ToggleResult | null> {
  const profile = await findProfile();
  if (!profile) return null;

  const user = await prisma.user.update({ where: { id: profile.userId }, data: { enabled } });

  let whatsapp: ToggleResult["whatsapp"] = "skipped";
  if (enabled && !profile.user.enabled && profile.phone) {
    try {
      await sendWelcomeWhatsApp(user.name, user.email, profile.phone, orgName);
      whatsapp = "sent";
    } catch (err) {
      console.error("No se pudo enviar bienvenida por WhatsApp", err);
      whatsapp = "failed";
    }
  }

  return { enabled: user.enabled, whatsapp };
}
