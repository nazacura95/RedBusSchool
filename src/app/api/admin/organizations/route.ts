import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/require-org";
import { NextResponse } from "next/server";

function randomPassword(): string {
  // legible para pasarle de palabra/WhatsApp al cliente — evita caracteres ambiguos (0/O, 1/l/I).
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(crypto.randomFillSync(new Uint8Array(10)))
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Paso 1 del wizard de /admin/clientes/nuevo: crea la organización y su usuario director.
// A diferencia de students/teachers (que se activan solos desde /recuperar), el director de un
// instituto nuevo recibe una contraseña real ya generada — hay que pasársela de una, no queda
// tiempo para que autoactive nada en el momento de la venta.
export async function POST(req: Request) {
  const { response } = await requirePlatformAdmin();
  if (response) return response;

  const { name, ownerName, ownerEmail } = await req.json();
  if (!name?.trim() || !ownerName?.trim() || !ownerEmail?.trim()) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const baseSlug = slugify(name) || "instituto";
  let slug = baseSlug;
  for (let i = 1; await prisma.organization.findUnique({ where: { slug } }); i++) {
    slug = `${baseSlug}-${i}`;
  }

  const password = randomPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name: name.trim(), slug } });
      const owner = await tx.user.create({
        data: {
          email: ownerEmail.trim().toLowerCase(),
          passwordHash,
          name: ownerName.trim(),
          roles: ["DIRECTIVO", "DOCENTE"],
          enabled: true,
          organizationId: org.id,
        },
      });
      await tx.teacherProfile.create({ data: { userId: owner.id, organizationId: org.id } });
      return { org, owner };
    });

    return NextResponse.json({
      organization: { id: result.org.id, name: result.org.name, slug: result.org.slug },
      owner: { email: result.owner.email, password },
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 400 });
    }
    throw err;
  }
}
