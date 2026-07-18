import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { NextResponse } from "next/server";

export async function GET() {
  const { response } = await requireRole("DIRECTIVO");
  if (response) return response;

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
