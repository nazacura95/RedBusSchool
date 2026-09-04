// Formato común entre los dos caminos de carga (Excel determinístico, Word/PDF vía IA) y la
// pantalla de revisión del wizard — ambos convergen acá antes de guardar nada en la base.
export type RosterRow = {
  name: string;
  dni: string;
  phone: string;
  email?: string;
  classroomName: string; // nivel/curso al que pertenece, texto libre (se crea el aula si no existe)
};

export type ReviewRow = RosterRow & {
  rowIndex: number;
  errors: string[];
};

function normalizeDni(raw: string): string {
  return raw.replace(/\D/g, "");
}

// Válida cada fila (campos obligatorios, formato básico) y marca DNIs duplicados dentro del
// mismo archivo — nunca contra la base todavía, eso lo hace /import/confirm al guardar.
export function validateRows(rows: RosterRow[]): ReviewRow[] {
  const dniCounts = new Map<string, number>();
  for (const r of rows) {
    const key = normalizeDni(r.dni || "");
    if (key) dniCounts.set(key, (dniCounts.get(key) ?? 0) + 1);
  }

  return rows.map((row, rowIndex) => {
    const errors: string[] = [];
    if (!row.name?.trim()) errors.push("Falta el nombre");
    if (!row.dni?.trim()) errors.push("Falta el DNI");
    else if (normalizeDni(row.dni).length < 6) errors.push("DNI con formato dudoso");
    if (!row.phone?.trim()) errors.push("Falta el teléfono");
    if (!row.classroomName?.trim()) errors.push("Falta el aula/nivel");
    const dniKey = normalizeDni(row.dni || "");
    if (dniKey && (dniCounts.get(dniKey) ?? 0) > 1) errors.push("DNI repetido en el archivo");

    return { ...row, rowIndex, errors };
  });
}
