export type ShiftColumn = "diurno" | "vespertino" | "nocturno";

/**
 * Determina la columna del turno seg�n hora de inicio (y/o etiqueta expl�cita).
 * - Si explicit (ej. "Diurno"/"Nocturno"/"Vespertino") viene del API, lo respeta (normalizando).
 * - Si no, usa la hora local del startIso.
 * - Maneja turnos que cruzan medianoche: se decide seg�n la hora de inicio.
 */
export function determineShiftColumn(
  startIso: string | Date | undefined,
  endIso?: string | Date | undefined,
  explicit?: string | undefined
): ShiftColumn {
  if (explicit) {
    const e = explicit.trim().toLowerCase();
    if (e.includes("diurn") || e.includes("day")) return "diurno";
    if (e.includes("vespert") || e.includes("afternoon")) return "vespertino";
    if (e.includes("noct") || e.includes("night")) return "nocturno";
  }

  if (!startIso) {
    return "diurno";
  }

  const start = typeof startIso === "string" ? new Date(startIso) : startIso;
  if (isNaN(start.getTime())) {
    return "diurno";
  }

  const hour = start.getHours();
  if (hour >= 6 && hour < 14) return "diurno";
  if (hour >= 14 && hour < 22) return "vespertino";
  return "nocturno";
}