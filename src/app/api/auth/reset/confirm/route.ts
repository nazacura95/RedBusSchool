import { NextResponse } from "next/server";
import { confirmPasswordReset } from "@/lib/password-reset";

export async function POST(req: Request) {
  const { email, code, password } = await req.json();
  if (!email || !code || !password || password.length < 6) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const result = await confirmPasswordReset(email, code, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
