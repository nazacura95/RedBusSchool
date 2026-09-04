import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/lib/openwa";
import { normalizePhone } from "@/lib/phone";
import { getDefaultOrganizationId } from "@/lib/default-organization";

const REMIND_EVERY_MS = 7 * 24 * 60 * 60 * 1000;

// Vercel Cron (ver vercel.json) pega acá una vez por día. Recuerda por WhatsApp las cuotas
// vencidas, sin repetir el aviso a la misma persona más de una vez por semana.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // primero pasa a VENCIDO cualquier cuota PENDIENTE cuyo vencimiento ya pasó, para que el
  // directivo no tenga que acordarse de cambiarlo a mano ni el resto del sistema (paneles,
  // reportes, este mismo cron) dependa de un estado desactualizado. Esto es correcto para
  // TODAS las organizaciones por igual — el vencimiento por fecha no depende del tenant.
  await prisma.payment.updateMany({
    where: { status: "PENDIENTE", dueDate: { lt: new Date() } },
    data: { status: "VENCIDO" },
  });

  // el envío por WhatsApp, en cambio, solo puede hacerse para la organización dueña de la
  // única sesión de OpenWA que existe hoy (ver src/lib/openwa.ts) — si otra organización
  // tuviera cuotas vencidas, no hay forma de avisarle por este canal todavía. Temporal,
  // atado a que WhatsApp multi-tenant no está en esta etapa (ver default-organization.ts).
  const organizationId = await getDefaultOrganizationId();
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId }, select: { name: true } });
  const cutoff = new Date(Date.now() - REMIND_EVERY_MS);
  const overdue = await prisma.payment.findMany({
    where: {
      organizationId,
      status: "VENCIDO",
      OR: [{ remindedAt: null }, { remindedAt: { lt: cutoff } }],
    },
    include: { student: { include: { user: true, contacts: true } } },
  });

  let sent = 0;
  for (const payment of overdue) {
    const message = `Hola ${payment.student.user.name}! Te recordamos que la cuota de ${payment.period} ($${payment.amount}) está vencida en ${organization.name}. Cualquier consulta, respondé este mensaje.`;

    // el mismo aviso va al alumno y a sus contactos de emergencia (padre/madre/tutor) —
    // reusa el teléfono que ya cargó el directivo, sin necesidad de un portal aparte.
    const recipients = [payment.student.phone, ...payment.student.contacts.map((c) => c.phone)].filter(
      (phone): phone is string => Boolean(phone),
    );

    let deliveredToAny = false;
    for (const phone of recipients) {
      try {
        await sendWhatsAppText(normalizePhone(phone), message);
        deliveredToAny = true;
      } catch (err) {
        console.error("No se pudo enviar recordatorio de pago", payment.id, phone, err);
      }
    }

    if (deliveredToAny) {
      await prisma.payment.update({ where: { id: payment.id }, data: { remindedAt: new Date() } });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, total: overdue.length });
}
