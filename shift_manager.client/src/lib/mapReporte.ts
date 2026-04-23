import { EmergencyReport, prop } from "./api";

export function mapReporte(r: any): EmergencyReport {
    const prioridadMap: Record<string, string> = {
        Critica: "high", Alta: "high", Media: "medium", Baja: "low",
    };
    const estadoMap: Record<string, string> = {
        Pendiente: "pending", EnProceso: "in_progress", Cerrado: "resolved",
    };

    const id = prop(r, "iD_Reporte", "id_Reporte", "idReporte", "ID_Reporte") ?? r.id ?? "";
    const prioridad = prop(r, "prioridad", "Prioridad") ?? "";
    const estado = prop(r, "estado", "Estado") ?? "";
    const agenteId = prop(r, "iD_Agente", "id_Agente", "idAgente", "ID_Agente");
    const cuadId = prop(r, "iD_Cuadrante", "id_Cuadrante", "idCuadrante", "ID_Cuadrante");

    const cuadranteObj = prop(r, "cuadrante", "Cuadrante");
    const location = cuadranteObj
        ? (prop(cuadranteObj, "nombre", "Nombre") ?? `Cuadrante ${cuadId}`)
        : `Cuadrante ${cuadId}`;

    return {
        id: String(id),
        reportNumber: `RPT-${String(id).padStart(4, "0")}`,
        type: (prop(r, "tipo", "Tipo") ?? "").toLowerCase().replace(/\s/g, "_") || "non_emergency",
        priority: prioridadMap[prioridad] ?? "medium",
        status: estadoMap[estado] ?? "pending",
        description: prop(r, "descripcion", "Descripcion") ?? "",
        location,
        assignedOfficerId: agenteId ? String(agenteId) : undefined,
        beatId: cuadId ? String(cuadId) : undefined,
        reportedAt: prop(r, "fechaCreacion", "FechaCreacion") ?? new Date().toISOString(),
        resolvedAt: prop(r, "fechaCierre", "FechaCierre") ?? undefined,
        notes: undefined,
        vistoPorAgente: prop(r, "vistoPorAgente", "VistoPorAgente") ?? undefined,
    };
}
