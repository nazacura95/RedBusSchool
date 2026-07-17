// normaliza a formato E.164 sin "+" para WhatsApp (ej: 5491122334455).
// ponytail: heurística para números argentinos, no un parser general — si empiezan a cargar
// datos de otros países o números mal tipeados (con "15" o "0" de más), migrar a libphonenumber-js.
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0/, "");
  if (digits.startsWith("54")) return digits;
  if (digits.startsWith("9")) return `54${digits}`;
  return `549${digits}`;
}
