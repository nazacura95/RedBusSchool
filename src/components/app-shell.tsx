import { prisma } from "@/lib/prisma";
import { generateColorScale, colorScaleToCssVars, DEFAULT_PRIMARY_HEX } from "@/lib/color-scale";
import { AppShellClient } from "./app-shell-client";

type Role = "ALUMNO" | "DOCENTE" | "DIRECTIVO";

// Server Component a propósito: resuelve la marca del instituto (nombre/logo/color) una sola
// vez acá, en vez de que cada una de las ~13 páginas que usan AppShell repita el fetch. El color
// se aplica pisando las custom properties --color-primary-* de globals.css para esta respuesta
// (Tailwind v4 las resuelve en runtime, así que ningún componente que use bg-primary-500/
// text-primary-500 necesita cambiar para heredar el color del instituto).
export async function AppShell({
  organizationId,
  roles,
  name,
  title,
  children,
}: {
  organizationId: string;
  roles: Role[];
  name: string;
  title: string;
  children: React.ReactNode;
}) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, logoUrl: true, primaryColorHex: true },
  });

  const scale = generateColorScale(org?.primaryColorHex ?? DEFAULT_PRIMARY_HEX);
  const cssVars = colorScaleToCssVars(scale);

  return (
    <>
      {/* pisa la escala de color de globals.css para el documento de esta respuesta —
          no hay fuga entre requests, cada carga de página renderiza su propio <style>. */}
      <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVars} }` }} />
      <AppShellClient roles={roles} name={name} title={title} orgName={org?.name ?? "Bedel"} logoUrl={org?.logoUrl ?? null}>
        {children}
      </AppShellClient>
    </>
  );
}
