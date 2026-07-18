// próxima ocurrencia de un aula con horario fijo, a partir de ahora (incluye hoy si todavía no pasó la hora).
export function nextClassDate(dayOfWeek: number[], startTime: string | null): Date | null {
  if (dayOfWeek.length === 0 || !startTime) return null;

  const [hours, minutes] = startTime.split(":").map(Number);
  const now = new Date();

  for (let offset = 0; offset < 8; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);
    if (dayOfWeek.includes(candidate.getDay()) && candidate.getTime() > now.getTime()) {
      return candidate;
    }
  }
  return null;
}

const DAY_LABELS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function formatNextClass(date: Date | null): string {
  if (!date) return "Sin horario cargado";
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Hoy ${time}`;
  if (isTomorrow) return `Mañana ${time}`;
  return `${DAY_LABELS[date.getDay()]} ${time}`;
}
