import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendWhatsAppText } from "@/lib/openwa";
import { handleIncomingMessage } from "@/lib/whatsapp-flow";

const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET;
const TEST_NUMBERS = (process.env.WHATSAPP_TEST_NUMBERS ?? "").split(",").map(n => n.trim()).filter(Boolean);

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!WEBHOOK_SECRET) return false;
  if (!signatureHeader) return false;
  const expected = `sha256=${crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!verifySignature(rawBody, req.headers.get("x-openwa-signature"))) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as { event: string; data: Record<string, unknown> };
  if (payload.event !== "message.received") {
    return NextResponse.json({ ok: true });
  }

  const data = payload.data;
  if (data.fromMe === true) {
    return NextResponse.json({ ok: true });
  }

  const from = typeof data.from === "string" ? data.from : "";
  const body = typeof data.body === "string" ? data.body : "";
  const phone = from.replace(/@c\.us$/i, "");

  // WHATSAPP_TEST_NUMBERS es opcional: si está seteada, restringe el bot a esos números
  // (útil para probar sin exponerlo a desconocidos). Vacía/sin setear = responde a cualquiera,
  // que es lo que hace falta una vez que el bot está en producción real.
  if (!body || (TEST_NUMBERS.length > 0 && !TEST_NUMBERS.includes(phone))) {
    return NextResponse.json({ ok: true });
  }

  const replies = await handleIncomingMessage(phone, body);
  for (const text of replies) {
    await sendWhatsAppText(phone, text);
  }

  return NextResponse.json({ ok: true });
}
