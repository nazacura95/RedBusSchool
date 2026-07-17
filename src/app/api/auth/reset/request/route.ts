import { NextResponse } from "next/server";
import { requestPasswordResetCode } from "@/lib/password-reset";

export async function POST(req: Request) {
  const { email, phone } = await req.json();
  if (!email || !phone) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  try {
    const result = await requestPasswordResetCode(email, phone);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("No se pudo enviar el código por WhatsApp", err);
    return NextResponse.json({ error: "No pudimos enviar el WhatsApp ahora mismo. Probá de nuevo en un rato." }, { status: 503 });
  }
}
