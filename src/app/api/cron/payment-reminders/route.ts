import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/lib/openwa";
import { normalizePhone } from "@/lib/phone";

const REMIND_EVERY_MS = 7 * 24 * 60 * 60 * 1000;

// Vercel Cron (ver vercel.json) pega acá una vez por día. Recuerda por WhatsApp las cuotas
// vencidas, sin repetir el aviso a la misma persona más de una vez por semana.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - REMIND_EVERY_MS);
  const overdue = await prisma.payment.findMany({
    where: {
      status: "VENCIDO",
      OR: [{ remindedAt: null }, { remindedAt: { lt: cutoff } }],
    },
    include: { student: { include: { user: true, contacts: true } } },
  });

  let sent = 0;
  for (const payment of overdue) {
    const message = `Hola ${payment.student.user.name}! Te recordamos que la cuota de ${payment.period} ($${payment.amount}) está vencida en Redbus School of English. Cualquier consulta, respondé este mensaje.`;

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
