import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/require-org";
import { isValidHex } from "@/lib/color-scale";
import { NextResponse } from "next/server";

// mismo patrón que classrooms/[id]/materials/route.ts (put/del de @vercel/blob, access público) —
// gateado por requirePlatformAdmin en vez de rol de instituto, porque esto se usa desde /admin.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requirePlatformAdmin();
  if (response) return response;

  const { id } = await params;
  const org = await prisma.organization.findUnique({ where: { id }, select: { id: true, logoUrl: true } });
  if (!org) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("logo") as File | null;
  const primaryColorHex = (form.get("primaryColorHex") as string | null)?.trim() || null;

  if (primaryColorHex && !isValidHex(primaryColorHex)) {
    return NextResponse.json({ error: "Color inválido — formato esperado #rrggbb" }, { status: 400 });
  }

  let logoUrl = org.logoUrl;
  if (file && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El logo tiene que ser una imagen" }, { status: 400 });
    }
    const blob = await put(`branding/${id}/logo-${Date.now()}-${file.name}`, file, { access: "public" });
    logoUrl = blob.url;
    // limpiar el logo viejo, si había — evita ir acumulando blobs huérfanos con cada re-subida.
    if (org.logoUrl) {
      await del(org.logoUrl).catch((err) => console.error("No se pudo borrar el logo anterior", err));
    }
  }

  const updated = await prisma.organization.update({
    where: { id },
    data: { logoUrl, ...(primaryColorHex && { primaryColorHex }) },
    select: { id: true, name: true, logoUrl: true, primaryColorHex: true },
  });

  return NextResponse.json(updated);
}
