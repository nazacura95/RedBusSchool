import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/require-org";
import { getDefaultOrganizationId } from "@/lib/default-organization";
import { NextResponse } from "next/server";

export async function GET() {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const leads = await prisma.lead.findMany({
    where: { organizationId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(leads);
}

// endpoint público (llamado desde el formulario de la landing, sin sesión) — se estampa con
// la organización default porque, por ahora, la landing pública solo existe para Red Bus.
export async function POST(req: Request) {
  const { name, phone, email, interest, message } = await req.json();
  if (!name || !phone || !interest) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const organizationId = await getDefaultOrganizationId();
  const lead = await prisma.lead.create({
    data: { name, phone, email: email || null, interest, message: message || null, organizationId },
  });

  return NextResponse.json(lead);
}
