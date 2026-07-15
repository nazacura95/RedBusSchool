import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user.roles.includes("DIRECTIVO")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const leads = await prisma.lead.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(leads);
}

export async function POST(req: Request) {
  const { name, phone, email, interest, message } = await req.json();
  if (!name || !phone || !interest) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const lead = await prisma.lead.create({
    data: { name, phone, email: email || null, interest, message: message || null },
  });

  return NextResponse.json(lead);
}
