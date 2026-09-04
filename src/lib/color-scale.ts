// El cliente sube un solo color (el de su manual de marca) — esto genera la escala completa
// (50...900) que Tailwind necesita, ajustando luminosidad en HSL. El 500 queda exactamente el
// color que subió (fidelidad con lo que eligió); el resto se deriva, mismo criterio con el que
// está armada la escala propia de Redbus en globals.css (ver --color-primary-* ahí).

export type ColorScale = Record<"50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900", string>;

// color por default para instituciones que todavía no subieron el suyo — el rojo de Red Bus,
// para que nadie vea un color "roto"/gris antes de brandearse.
export const DEFAULT_PRIMARY_HEX = "#c8102e";

type Hsl = { h: number; s: number; l: number };

function hexToHsl(hex: string): Hsl {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return { h: h * 60, s: s * 100, l: l * 100 };
}

function hslToHex({ h, s, l }: Hsl): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// lightness objetivo por escalón, y cuánto se le resta a la saturación en los extremos claros
// (un tinte pastel 100% saturado se ve artificial — los sistemas de diseño lo desaturan un poco).
const LIGHTNESS: Record<string, number> = {
  "50": 96,
  "100": 91,
  "200": 82,
  "300": 68,
  "400": 56,
  "600": 40,
  "700": 31,
  "800": 22,
  "900": 14,
};
const SATURATION_ADJUST: Record<string, number> = { "50": -25, "100": -15, "200": -5 };

export function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function generateColorScale(baseHex: string): ColorScale {
  if (!isValidHex(baseHex)) {
    throw new Error(`Color inválido: "${baseHex}" — se espera formato hex de 6 dígitos, ej. "#c8102e".`);
  }
  const base = hexToHsl(baseHex);

  const scale = { "500": baseHex.toLowerCase() } as ColorScale;
  for (const step of ["50", "100", "200", "300", "400", "600", "700", "800", "900"] as const) {
    const s = Math.max(0, Math.min(100, base.s + (SATURATION_ADJUST[step] ?? 0)));
    scale[step] = hslToHex({ h: base.h, s, l: LIGHTNESS[step] });
  }
  return scale;
}

// para el <style> inline que pisa las custom properties de Tailwind en runtime (ver AppShell).
export function colorScaleToCssVars(scale: ColorScale): string {
  return (Object.keys(scale) as (keyof ColorScale)[])
    .map((step) => `--color-primary-${step}: ${scale[step]};`)
    .join(" ");
}
