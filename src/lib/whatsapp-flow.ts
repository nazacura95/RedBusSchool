import { prisma } from "@/lib/prisma";
import { getDefaultOrganizationId } from "@/lib/default-organization";

// genéricas a propósito (sin nombre de marca): antes decían "stop red bus"/"activar red bus",
// pero ahora el bot puede hablar en nombre de cualquier organización (ver getOrgName abajo).
const OPT_OUT_KEYWORDS = ["stop"];
const OPT_IN_KEYWORDS = ["activar"];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

type FlowData = { paraQuien?: string; nivel?: string; turno?: string };

function welcomeMessage(orgName: string) {
  return (
    `¡Hola! 👋 Bienvenido/a a *${orgName}*. ` +
    "Este es un chat de prueba para ver cómo se va a sentir la atención automática — ¡ya casi arrancamos de verdad!"
  );
}

const PREGUNTA_PARA_QUIEN = "¿Sos vos quien está interesado/a en las clases, o preguntás para un hijo/a?";
const PREGUNTA_NIVEL =
  '¿Qué nivel tenés hoy? Podés responder algo como "ninguno", "básico", "intermedio" o "ya sé pero quiero practicar".';
const PREGUNTA_TURNO = "Genial, ¡gracias! Con esa info te podemos armar la comisión que mejor te quede. ¿Preferís clases de mañana, tarde o noche?";

function closingMessage(orgName: string) {
  return (
    "Perfecto ✅ Ya tenemos lo básico. En breve alguien del equipo de admisiones te escribe para coordinar una entrevista rápida o prueba de nivel. " +
    `Gracias por tu interés en ${orgName} 🙌`
  );
}

// hoy solo existe una sesión de WhatsApp para todo el deploy (ver default-organization.ts) —
// esto resuelve tanto el id como el nombre de esa única organización que puede usar el bot.
async function getDefaultOrganization(): Promise<{ id: string; name: string }> {
  const id = await getDefaultOrganizationId();
  const org = await prisma.organization.findUniqueOrThrow({ where: { id }, select: { name: true } });
  return { id, name: org.name };
}

/**
 * Procesa un mensaje entrante de un número ya habilitado (allowlist verificada
 * antes de llamar a esto) y devuelve los mensajes a responder, si los hay.
 */
export async function handleIncomingMessage(phone: string, body: string): Promise<string[]> {
  const normalized = normalize(body);
  const org = await getDefaultOrganization();

  let conversation = await prisma.whatsAppConversation.findUnique({ where: { phone } });
  if (!conversation) {
    conversation = await prisma.whatsAppConversation.create({ data: { phone, organizationId: org.id } });
  }

  await prisma.whatsAppMessage.create({
    data: { conversationId: conversation.id, direction: "in", body },
  });

  // opt-out / opt-in siempre se procesan primero, sin importar el estado del bot
  if (OPT_OUT_KEYWORDS.includes(normalized)) {
    await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { botEnabled: false } });
    return await reply(
      conversation.id,
      "Listo, no te vamos a volver a escribir por acá 👍 Si en algún momento querés reactivarlo, mandanos \"ACTIVAR\".",
    );
  }
  if (!conversation.botEnabled) {
    if (OPT_IN_KEYWORDS.includes(normalized)) {
      await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { botEnabled: true } });
      return await reply(conversation.id, "Reactivado ✅ Seguimos donde quedamos.");
    }
    return []; // bot apagado para este número, no contestar nada más
  }

  const data = (conversation.flowData as FlowData | null) ?? {};

  if (conversation.flowStep === 0) {
    await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { flowStep: 1 } });
    return await reply(conversation.id, welcomeMessage(org.name), PREGUNTA_PARA_QUIEN);
  }

  if (conversation.flowStep === 1) {
    data.paraQuien = body;
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: { flowStep: 2, flowData: data },
    });
    return await reply(conversation.id, PREGUNTA_NIVEL);
  }

  if (conversation.flowStep === 2) {
    data.nivel = body;
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: { flowStep: 3, flowData: data },
    });
    return await reply(conversation.id, PREGUNTA_TURNO);
  }

  if (conversation.flowStep === 3) {
    data.turno = body;

    const lead = await prisma.lead.create({
      data: {
        name: `WhatsApp ${phone}`,
        phone,
        interest: [data.nivel, data.turno].filter(Boolean).join(" / ") || "sin especificar",
        message: `Para: ${data.paraQuien ?? "-"} · Nivel: ${data.nivel ?? "-"} · Turno: ${data.turno ?? "-"}`,
        organizationId: org.id,
      },
    });

    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: { flowStep: 4, flowData: data, leadId: lead.id },
    });
    return await reply(conversation.id, closingMessage(org.name));
  }

  // guion ya completo (flowStep >= 4): el bot no vuelve a escribir solo, lo retoma un humano
  return [];
}

async function reply(conversationId: string, ...messages: string[]): Promise<string[]> {
  await prisma.whatsAppMessage.createMany({
    data: messages.map(body => ({ conversationId, direction: "out" as const, body })),
  });
  return messages;
}
