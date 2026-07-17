import { NextResponse } from "next/server";
import { activateOrResetPassword } from "@/lib/password-reset";

export async function POST(req: Request) {
  const { email, dni, phone, password } = await req.json();
  if (!email || !dni || !phone || !password || password.length < 6) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const result = await activateOrResetPassword(email, dni, phone, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
