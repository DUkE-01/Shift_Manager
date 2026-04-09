import { prop } from "./api";
import { determineShiftColumn, ShiftColumn } from "./shiftUtils";

export interface MappedShift {
  id: string;
  start: string;
  end?: string;
  type?: string;
  assignedOfficerId?: string;
  shiftColumn: ShiftColumn;
  [key: string]: any;
}

/**
 * Mapea un objeto bruto de turno (API) a MappedShift e invoca determineShiftColumn
 * para decidir la columna (diurno/vespertino/nocturno).
 */
export function mapTurno(raw: any): MappedShift {
  const id = prop(raw, "id", "iD_Turno", "ID_Turno", "idTurno", "iD_Reporte") ?? raw.id ?? "";
  const start = prop(raw, "inicio", "fechaInicio", "start", "startDate") ?? raw.start ?? "";
  const end = prop(raw, "fin", "fechaFin", "end", "endDate") ?? raw.end ?? "";
  const tipo = prop(raw, "tipo", "Tipo", "turnoTipo", "descripcion") ?? raw.tipo ?? "";
  const agente = prop(raw, "iD_Agente", "id_Agente", "idAgente", "ID_Agente") ?? raw.agente ?? undefined;

  const shiftColumn = determineShiftColumn(start || undefined, end || undefined, tipo || undefined);

  return {
    id: String(id),
    start: String(start),
    end: end ? String(end) : undefined,
    type: tipo ? String(tipo) : undefined,
    assignedOfficerId: agente ? String(agente) : undefined,
    shiftColumn
  };
}