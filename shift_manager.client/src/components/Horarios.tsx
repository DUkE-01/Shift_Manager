import React, { useMemo } from "react";
import { mapTurno, MappedShift } from "../lib/mapTurno";
import type { ShiftColumn } from "../lib/shiftUtils";

type Props = {
  // Pasa aquí la respuesta cruda del API (array de turnos)
  rawShifts: any[];
  onSelect?: (shift: MappedShift) => void;
};

export default function Horarios({ rawShifts, onSelect }: Props) {
  // Mapea y normaliza los turnos una sola vez
  const mapped: MappedShift[] = useMemo(() => rawShifts.map(mapTurno), [rawShifts]);

  // Agrupa por columna
  const columns = useMemo(() => {
    const groups: Record<ShiftColumn, MappedShift[]> = {
      diurno: [],
      vespertino: [],
      nocturno: [],
    };
    mapped.forEach(s => groups[s.shiftColumn].push(s));
    return groups;
  }, [mapped]);

  const renderShift = (s: MappedShift) => {
    const start = s.start ? new Date(s.start).toLocaleString() : "—";
    const end = s.end ? new Date(s.end).toLocaleString() : "—";
    return (
      <div key={s.id} className="shift-card" onClick={() => onSelect?.(s)}>
        <div className="shift-id">#{s.id}</div>
        <div className="shift-type">{s.type ?? "Sin tipo"}</div>
        <div className="shift-time">{start} → {end}</div>
      </div>
    );
  };

  return (
    <div className="horarios-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
      <section>
        <h3>Diurno ({columns.diurno.length})</h3>
        {columns.diurno.map(renderShift)}
      </section>

      <section>
        <h3>Vespertino ({columns.vespertino.length})</h3>
        {columns.vespertino.map(renderShift)}
      </section>

      <section>
        <h3>Nocturno ({columns.nocturno.length})</h3>
        {columns.nocturno.map(renderShift)}
      </section>
    </div>
  );
}