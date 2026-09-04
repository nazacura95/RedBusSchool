import { prisma } from "@/lib/prisma";

// Usado solo por flujos que escriben sin sesión (bot de WhatsApp, formulario público de
// leads) y por el cron de recordatorios, que hoy solo puede mandar WhatsApp a través de la
// única sesión de OpenWA del deploy (ver WhatsAppConversation en prisma/schema.prisma).
// Cuando exista ruteo multi-tenant de WhatsApp, estos call sites dejan de necesitar esto.
const DEFAULT_ORGANIZATION_SLUG = process.env.BEDEL_DEFAULT_ORG_SLUG ?? "redbus";

let cachedId: string | null = null;

export async function getDefaultOrganizationId(): Promise<string> {
  if (cachedId) return cachedId;

  const org = await prisma.organization.findUnique({
    where: { slug: DEFAULT_ORGANIZATION_SLUG },
    select: { id: true },
  });
  if (!org) {
    throw new Error(
      `No existe la organización default "${DEFAULT_ORGANIZATION_SLUG}" — correr el backfill (prisma/scripts/backfill-organization.ts) o el seed antes de recibir leads/mensajes.`,
    );
  }

  cachedId = org.id;
  return cachedId;
}
