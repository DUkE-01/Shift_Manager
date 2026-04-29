
import { mapReporte } from "./mapReporte";
import { determineShiftColumn, ShiftColumn } from "./shiftUtils";
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

const BASE_URL = import.meta.env.VITE_API_URL || "";

const saveToken = async (token: string) => {
    if (isNative) { // Detectar si es App o Web
        await Preferences.set({ key: 'token', value: token });
    } else {
        localStorage.setItem('token', token);
    }
};

export function getToken(): string | null {
    return localStorage.getItem("access_token");
}

export function setAuth(accessToken: string, refreshToken: string, rol: string, username: string) {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("rol", rol);
    localStorage.setItem("username", username);
    
    // Si es nativo, también guardamos en Preferences para persistencia segura
    if (isNative) {
        Preferences.set({ key: 'access_token', value: accessToken });
        Preferences.set({ key: 'refresh_token', value: refreshToken });
    }
}

export function clearAuth() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("rol");
    localStorage.removeItem("username");
}

export async function fetchAPI(path: string, options: RequestInit = {}): Promise<Response> {
    const token = getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> ?? {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
            const refreshRes = await fetch(`${BASE_URL.replace(/\/api$/, '')}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                localStorage.setItem("access_token", data.accessToken);
                if (data.refreshToken) {
                    localStorage.setItem("refresh_token", data.refreshToken); // Actualizamos el refresh token rotado por seguridad!
                }
                headers["Authorization"] = `Bearer ${data.accessToken}`;
                return fetch(`${BASE_URL}${path}`, { ...options, headers });
            }
        }
        clearAuth();
        window.location.href = "/login";
    }

    return res;
}

export interface Officer {
    id: string;
    name: string;
    cedula: string;
    email: string;
    badge: string;
    rank: string;
    status: "on_duty" | "off_duty" | "unavailable";
    phone?: string;
    circunscripcion: number;
    puestoAsignado: string;
    cuadrantes?: string[];
    createdAt: string;
}

export interface Beat {
    id: string;
    name: string;
    description?: string;
    circunscripcion: number;
    cuadrante: number;
    active: boolean;
}

export interface Shift {
    id: string;
    officerId?: string;
    beatId?: string;
    date: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    status: string;
    shiftColumn?: ShiftColumn;
    notes?: string;
    createdAt: string;
}

export interface EmergencyReport {
    id: string;
    reportNumber: string;
    type: string;
    priority: string;
    status: string;
    description: string;
    location: string;
    callerName?: string;
    callerPhone?: string;
    assignedOfficerId?: string;
    beatId?: string;
    reportedAt: string;
    assignedAt?: string;
    resolvedAt?: string;
    notes?: string;
    vistoPorAgente?: boolean;
}

export interface DashboardStats {
    onDuty: number;
    offDuty: number;
    gaps: number;
    todayShifts: number;
}

export function prop(obj: any, ...keys: string[]): any {
    for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
}

function cuadranteToCircunscripcion(id: number): number {
    if ([1, 2, 7].includes(id)) return 1;
    if ([5, 6].includes(id)) return 2;
    if ([3, 4].includes(id)) return 3;
    return 1;
}

function mapAgente(a: any): Officer {
    const cuadranteId = Number(
        prop(a, "iD_Cuadrante", "id_Cuadrante", "idCuadrante", "ID_Cuadrante") ?? 1
    );
    const codigo = prop(a, "codigo_Agente", "codigoAgente", "Codigo_Agente") ?? "";
    const rango = prop(a, "rango", "Rango") ?? "";

    const puestoMap: Record<string, string> = {
        Teniente: "Palacio",
        Sargento: "Palacio",
        Cabo: "Patrullero",
        Agente: "Patrullero",
        Inspector: "Puesto Fijo",
    };

    return {
        id: String(prop(a, "iD_Agente", "id_Agente", "idAgente", "ID_Agente") ?? a.id ?? ""),
        name: `${prop(a, "nombre", "Nombre") ?? ""} ${prop(a, "apellido", "Apellido") ?? ""}`.trim(),
        cedula: prop(a, "cedula", "Cedula") ?? "",
        email: `${codigo}@pnm.gob.do`,
        badge: codigo,
        rank: rango,
        status: prop(a, "disponibilidad", "Disponibilidad")
            ? "on_duty"
            : prop(a, "activo", "Activo")
                ? "off_duty"
                : "unavailable",
        phone: prop(a, "contacto", "Contacto") ?? undefined,
        circunscripcion: cuadranteToCircunscripcion(cuadranteId),
        puestoAsignado: (() => {
            const explicit = prop(a, "puestoAsignado", "PuestoAsignado");
            if (explicit === 1) return "Palacio";
            if (explicit === 2) return "Patrullero";
            if (explicit === 3) return "Puesto Fijo";
            if (typeof explicit === "string") return explicit;
            return puestoMap[rango] ?? "Patrullero";
        })(),
        cuadrantes: [String(cuadranteId)],
        createdAt: prop(a, "fechaCreacion", "FechaCreacion") ?? new Date().toISOString(),
    };
}

function mapCuadrante(c: any): Beat {
    const id = Number(
        prop(c, "iD_Cuadrante", "id_Cuadrante", "idCuadrante", "ID_Cuadrante") ?? c.id ?? 1
    );
    return {
        id: String(id),
        name: prop(c, "nombre", "Nombre") ?? "",
        description: prop(c, "sector", "Sector") ?? undefined,
        circunscripcion: cuadranteToCircunscripcion(id),
        cuadrante: id,
        active: prop(c, "activo", "Activo") ?? true,
    };
}

function inferShiftTypeFromHours(startIso: string, endIso?: string): string {
    if (!startIso) return "diurno";
    const d = new Date(startIso);
    if (isNaN(d.getTime())) return "diurno";
    const h = d.getHours();
    const dow = d.getDay();
    if (h >= 20 || h < 6) return "nocturno";
    if (h >= 6 && h < 14) return "diurno";
    if (h >= 14 && h < 20) {
        const isWeekend = dow === 0 || dow === 5 || dow === 6;
        return isWeekend ? "vespertino_vd" : "vespertino_lj";
    }
    return "diurno";
}

function mapTurno(t: any): Shift {
    const inicio = prop(t, "fechaProgramadaInicio", "FechaProgramadaInicio", "fechaInicio", "FechaInicio", "inicio", "Inicio") ?? "";
    const fin = prop(t, "fechaProgramadaFin", "FechaProgramadaFin", "fechaFin", "FechaFin", "fin", "Fin") ?? "";

    const toTime = (dt: string) =>
        dt.includes("T") ? dt.split("T")[1]?.substring(0, 5) ?? "00:00"
            : dt.substring(0, 5);

    const statusMap: Record<string, string> = {
        Activo: "active",
        Programado: "scheduled",
        Cerrado: "completed",
        Cancelado: "cancelled",
    };

    const agenteId = prop(t, "iD_Agente", "id_Agente", "idAgente", "ID_Agente");
    const cuadranteId = prop(t, "iD_Cuadrante", "id_Cuadrante", "idCuadrante", "ID_Cuadrante");
    const estado = prop(t, "estado", "Estado") ?? "";

    // Asegurar que solo tomamos la parte de la fecha (yyyy-MM-dd)
    const date = inicio ? (inicio.includes("T") ? inicio.split("T")[0] : inicio.split(" ")[0]) : "";
    const startTime = inicio ? toTime(inicio) : "00:00";
    const endTime = fin ? toTime(fin) : "00:00";
    const obs = prop(t, "observaciones", "Observaciones") ?? "";
    const obsTypeMatch = typeof obs === "string" ? obs.match(/^\[([a-z_]+)\]/) : null;
    const explicitType = prop(t, "tipoTurno", "TipoTurno") ?? (obsTypeMatch ? obsTypeMatch[1] : null);

    let shiftType = explicitType ?? inferShiftTypeFromHours(inicio, fin);

    // Normalización para el frontend
    const normalize = (val: string): string => {
        const s = val.toLowerCase();
        if (s.includes("vespertino") || s.includes("vesp")) {
            const d = new Date(inicio);
            const dow = isNaN(d.getTime()) ? 1 : d.getDay();
            const isWeekend = dow === 0 || dow === 5 || dow === 6;
            return isWeekend ? "vespertino_vd" : "vespertino_lj";
        }
        if (s.includes("nocturno") || s.includes("noche")) return "nocturno";
        if (s.includes("diurno") || s.includes("mañana") || s.includes("tarde")) return "diurno";
        return s;
    };
    shiftType = normalize(shiftType);

    const startIso = inicio || (date ? `${date}T${startTime}:00` : undefined);
    const endIso = fin || (date ? `${date}T${endTime}:00` : undefined);

    const shiftColumn = determineShiftColumn(startIso, endIso, shiftType);

    return {
        id: String(prop(t, "iD_Turno", "id_Turno", "idTurno", "ID_Turno") ?? t.id ?? ""),
        officerId: agenteId ? String(agenteId) : undefined,
        beatId: cuadranteId ? String(cuadranteId) : undefined,
        date: date,
        shiftType: shiftType,
        startTime: startTime,
        endTime: endTime,
        status: statusMap[estado] ?? "scheduled",
        shiftColumn,
        notes: (() => {
            const raw = prop(t, "observaciones", "Observaciones");
            if (!raw) return undefined;
            return String(raw).replace(/^\[[a-z_]+\]\s*/, "") || undefined;
        })(),
        createdAt: prop(t, "fechaCreacion", "FechaCreacion") ?? new Date().toISOString(),
    };
}

function mapHorario(h: any, codeToId?: Map<string, string>): Shift {
    const toTime = (t: any) =>
        typeof t === "string" ? t.substring(0, 5) : "00:00";

    const estado = prop(h, "estado", "Estado") ?? "";
    const statusMap: Record<string, string> = {
        Activo: "active",
        Completado: "completed",
        Programado: "scheduled",
        Cancelado: "cancelled",
    };

    const codigoAgente = prop(h, "idAgente", "IdAgente", "ID_Agente", "Codigo_Agente") ?? prop(h, "idAgente", "IdAgente");
    let officerId: string | undefined = undefined;
    if (codigoAgente && codeToId) {
        const resolved = codeToId.get(String(codigoAgente));
        if (resolved) officerId = resolved;
    }

    // Asegurar que solo tomamos la parte de la fecha (yyyy-MM-dd)
    let date = prop(h, "fecha", "Fecha") ?? "";
    if (date.includes("T")) date = date.split("T")[0];
    else if (date.includes(" ")) date = date.split(" ")[0];
    const startTime = toTime(prop(h, "horaInicio", "HoraInicio"));
    const endTime = toTime(prop(h, "horaFin", "HoraFin"));

    let shiftType = prop(h, "tipoTurno", "TipoTurno") ?? "diurno";

    // Normalización para el frontend
    const s = shiftType.toLowerCase();
    if (s.includes("vespertino") || s.includes("vesp")) {
        const d = new Date(date);
        const dow = isNaN(d.getTime()) ? 1 : d.getDay();
        const isWeekend = dow === 0 || dow === 5 || dow === 6;
        shiftType = isWeekend ? "vespertino_vd" : "vespertino_lj";
    } else if (s.includes("nocturno") || s.includes("noche")) {
        shiftType = "nocturno";
    } else if (s.includes("diurno") || s.includes("mañana") || s.includes("tarde")) {
        shiftType = "diurno";
    } else {
        shiftType = "diurno"; // Fallback para tipos desconocidos
    }

    const startIso = date && startTime ? `${date}T${startTime}:00` : undefined;
    const endIso = date && endTime ? `${date}T${endTime}:00` : undefined;

    const shiftColumn = determineShiftColumn(startIso, endIso, shiftType);

    return {
        id: String(prop(h, "idHorario", "IdHorario") ?? h.id ?? ""),
        officerId: officerId,
        beatId: String(prop(h, "idCuadrante", "IdCuadrante") ?? ""),
        date: date,
        shiftType: shiftType,
        startTime: startTime,
        endTime: endTime,
        status: statusMap[estado] ?? "scheduled",
        shiftColumn,
        notes: prop(h, "observaciones", "Observaciones") ?? undefined,
        createdAt: prop(h, "fechaCreacion", "FechaCreacion") ?? new Date().toISOString(),
    };
}

export async function login(username: string, password: string) {
    const res = await fetch(`${BASE_URL.replace(/\/api$/, '')}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Credenciales inválidas");
    }
    const data = await res.json();
    setAuth(data.accessToken, data.refreshToken, data.rol, data.username);
    return data;
}

export async function logout() {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
        await fetchAPI("/api/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
        });
    } finally {
        clearAuth();
    }
}

export function isLoggedIn(): boolean {
    return !!getToken();
}

export function getCurrentUser() {
    return {
        username: localStorage.getItem("username") ?? "",
        rol: localStorage.getItem("rol") ?? "",
    };
}

export async function getOfficers(): Promise<Officer[]> {
    const res = await fetchAPI("/api/agentes");
    if (!res.ok) throw new Error("Error obteniendo agentes");
    return (await res.json()).map(mapAgente);
}

export async function getOfficer(id: string): Promise<Officer> {
    const res = await fetchAPI(`/api/agentes/${id}`);
    if (!res.ok) throw new Error("Agente no encontrado");
    return mapAgente(await res.json());
}

export async function createOfficer(officer: Partial<Officer>): Promise<Officer> {
    const payload = {
        Codigo_Agente: officer.badge,
        Nombre: officer.name?.split(" ")[0] ?? "",
        Apellido: officer.name?.split(" ").slice(1).join(" ") ?? "",
        Cedula: officer.cedula,
        Rango: officer.rank,
        Contacto: officer.phone ?? null,
        ID_Cuadrante: Number(officer.cuadrantes?.[0] ?? 1),
        PuestoAsignado: officer.puestoAsignado,
        Disponibilidad: officer.status === "on_duty",
        Activo: true,
    };
    const res = await fetchAPI("/api/agentes", { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text());
    return mapAgente(await res.json());
}

export async function updateOfficer(id: string, data: Partial<Officer>): Promise<Officer> {
    const currentRes = await fetchAPI(`/api/agentes/${id}`);
    if (!currentRes.ok) throw new Error("No se pudo obtener el agente actual");
    const current = await currentRes.json();

    const nameParts = data.name?.trim().split(" ") ?? [];
    const newNombre = nameParts[0] ?? prop(current, "nombre", "Nombre");
    const newApellido = nameParts.length > 1
        ? nameParts.slice(1).join(" ")
        : prop(current, "apellido", "Apellido");

    const circToDefaultCuadrante: Record<number, number> = { 1: 1, 2: 5, 3: 3 };
    const newCuadrante = data.cuadrantes?.[0]
        ? Number(data.cuadrantes[0])
        : data.circunscripcion
            ? (circToDefaultCuadrante[data.circunscripcion] ?? prop(current, "iD_Cuadrante", "ID_Cuadrante"))
            : prop(current, "iD_Cuadrante", "ID_Cuadrante");

    const payload = {
        Nombre: newNombre,
        Apellido: newApellido,
        Cedula: data.cedula ?? prop(current, "cedula", "Cedula"),
        Codigo_Agente: data.badge ?? prop(current, "codigo_Agente", "Codigo_Agente"),
        Rango: data.rank ?? prop(current, "rango", "Rango"),
        Contacto: data.phone ?? prop(current, "contacto", "Contacto"),
        ID_Cuadrante: newCuadrante,
        PuestoAsignado: data.puestoAsignado ?? prop(current, "puestoAsignado", "PuestoAsignado"),
        Disponibilidad: data.status === "on_duty" ? true
            : data.status === "off_duty" ? false
                : data.status === "unavailable" ? false
                    : prop(current, "disponibilidad", "Disponibilidad"),
        Activo: prop(current, "activo", "Activo") ?? true,
    };

    const res = await fetchAPI(`/api/agentes/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text());
    return mapAgente(await res.json());
}

export async function getBeats(): Promise<Beat[]> {
    const res = await fetchAPI("/api/cuadrantes");
    if (!res.ok) throw new Error("Error obteniendo cuadrantes");
    return (await res.json()).map(mapCuadrante);
}

export async function getShifts(): Promise<Shift[]> {
    const [turnosRes, horariosRes, agentesRes] = await Promise.all([
        fetchAPI("/api/turnos"),
        fetchAPI("/api/horarios"),
        fetchAPI("/api/agentes"),
    ]);

    let turnos: Shift[] = [];
    if (turnosRes.ok) {
        const json = await turnosRes.json();
        // El backend devuelve PagedResult para Admin/Supervisor y List para Agentes
        const rawList = Array.isArray(json) ? json : (json.items || json.data || []);
        turnos = rawList.map((raw: any) => {
            const mapped = mapTurno(raw);
            mapped.id = `t_${mapped.id}`;
            return mapped;
        });
    }

    const horariosRaw = horariosRes.ok ? await horariosRes.json() : [];
    const agentesRaw = agentesRes.ok ? (await agentesRes.json()) : [];

    const agentesMapped: Officer[] = agentesRaw.map(mapAgente);
    const codeToId = new Map<string, string>();
    agentesMapped.forEach(a => {
        if (a.badge) codeToId.set(a.badge, a.id);
    });

    const horarios: Shift[] = horariosRaw.length > 0
        ? horariosRaw.map((h: any) => {
            const mapped = mapHorario(h, codeToId);
            mapped.id = `h_${mapped.id}`;
            return mapped;
        })
        : [];

    // Ahora ambos ecosistemas coexisten sin matarse por el mismo ID.
    // Deduplicar: Si un turno existe en ambas tablas, preferimos el de la tabla Turnos (t_)
    // pero mantenemos los Horarios (h_) que no tengan un Turno asociado.
    const turnosIds = new Set(turnos.map(t => t.id.replace("t_", "")));
    const uniqueHorarios = horarios.filter(h => !turnosIds.has(h.id.replace("h_", "")));

    const all = [...turnos, ...uniqueHorarios].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );

    return all;
}

export async function updateShift(compositeId: string, shift: Partial<Shift>): Promise<Shift> {
    const isHorario = compositeId.startsWith("h_");
    const id = compositeId.replace("t_", "").replace("h_", "");
 
    if (isHorario) {
        const payload: any = { IdHorario: Number(id) };
        if (shift.officerId)            payload.IdAgente    = Number(shift.officerId);
        if (shift.beatId)               payload.IdCuadrante = Number(shift.beatId);
        if (shift.date)                 payload.Fecha       = shift.date;
        if (shift.startTime)            payload.HoraInicio  = `${shift.startTime}:00`;
        if (shift.endTime)              payload.HoraFin     = `${shift.endTime}:00`;
        if (shift.shiftType)            payload.TipoTurno   = shift.shiftType;   // ← añadido
        if (shift.notes !== undefined)  payload.Observaciones = shift.notes;
 
        const res = await fetchAPI(`/api/horarios/${id}`, {
            method: "PUT",
            body:   JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text() || "Error actualizando horario");
        const mapRes = mapHorario(await res.json());
        mapRes.id = `h_${mapRes.id}`;
        return mapRes;
    }
 
    // ── Ruta estándar para Turnos ────────────────────────────────────────────
    const payload: any = {};
 
    if (shift.officerId)  payload.ID_Agente    = Number(shift.officerId);
    if (shift.beatId)     payload.ID_Cuadrante = Number(shift.beatId);
    if (shift.shiftType)  payload.TipoTurno    = shift.shiftType;             // ← añadido
 
    // Fechas: construir ISO desde date + startTime / endTime
    if (shift.date && shift.startTime) {
        payload.FechaProgramadaInicio = `${shift.date}T${shift.startTime}:00`;
    }
    if (shift.date && shift.endTime) {
        const [sh] = (shift.startTime ?? "00:00").split(":").map(Number);
        const [eh] = shift.endTime.split(":").map(Number);
        if (eh < sh) {
            // Cruza medianoche → fecha fin = date + 1
            const next = new Date(shift.date + "T00:00:00");
            next.setDate(next.getDate() + 1);
            payload.FechaProgramadaFin = `${next.toISOString().split("T")[0]}T${shift.endTime}:00`;
        } else {
            payload.FechaProgramadaFin = `${shift.date}T${shift.endTime}:00`;
        }
    }
 
    if (shift.notes !== undefined) payload.Observaciones = shift.notes;
 
    const res = await fetchAPI(`/api/turnos/${id}`, {
        method: "PUT",
        body:   JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text() || "Error actualizando turno");
    const mapRes = mapTurno(await res.json());
    mapRes.id = `t_${mapRes.id}`;
    return mapRes;
}

export async function createShift(shift: Partial<Shift>): Promise<Shift> {
    const agenteId = Number(shift.officerId);
    const cuadranteId = Number(shift.beatId);

    if (!agenteId || agenteId <= 0) throw new Error("Debe seleccionar un oficial válido");
    if (!cuadranteId || cuadranteId <= 0) throw new Error("Debe seleccionar un cuadrante válido");
    if (!shift.date) throw new Error("La fecha es requerida");
    if (!shift.startTime) throw new Error("La hora de inicio es requerida");
    if (!shift.endTime) throw new Error("La hora de fin es requerida");

    const startDate = shift.date!;
    const [startH] = shift.startTime!.split(":").map(Number);
    const [endH] = shift.endTime!.split(":").map(Number);
    let endDate = startDate;
    if (endH < startH) {
        const next = new Date(startDate + "T00:00:00");
        next.setDate(next.getDate() + 1);
        endDate = next.toISOString().split("T")[0];
    }

    const payload = {
        ID_Agente: agenteId,
        ID_Cuadrante: cuadranteId,
        FechaProgramadaInicio: `${startDate}T${shift.startTime}:00`,
        FechaProgramadaFin: `${endDate}T${shift.endTime}:00`,
        Observaciones: shift.notes ?? null,
    };
    const res = await fetchAPI("/api/turnos", { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "No se pudo crear/actualizar el turno");
    }
    return await res.json();
}

export async function getEmergencyReports(): Promise<EmergencyReport[]> {
    const res = await fetchAPI("/api/reportes");
    if (!res.ok) throw new Error("Error obteniendo reportes");
    return (await res.json()).map(mapReporte);
}

export async function createEmergencyReport(report: Partial<EmergencyReport>): Promise<EmergencyReport> {
    const prioridadMap: Record<string, string> = { high: "Alta", medium: "Media", low: "Baja" };
    const payload = {
        ID_Turno: 0,
        ID_Agente: Number(report.assignedOfficerId) || 1,
        ID_Cuadrante: Number(report.beatId) || 1,
        Tipo: report.type ?? "Incidente",
        Descripcion: report.description ?? "",
        Estado: "Pendiente",
        Prioridad: prioridadMap[report.priority ?? "medium"] ?? "Media",
    };
    const res = await fetchAPI("/api/reportes", { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text());
    return report as EmergencyReport;
}

export async function updateEmergencyReport(id: string, data: Partial<EmergencyReport>): Promise<EmergencyReport> {
    const estadoMap: Record<string, string> = {
        pending: "Pendiente", in_progress: "EnProceso", assigned: "EnProceso", resolved: "Cerrado", closed: "Cerrado",
    };
    const prioridadMap: Record<string, string> = {
        high: "Alta", medium: "Media", low: "Baja",
    };
    const tipoMap: Record<string, string> = {
        emergency: "Incidente", non_emergency: "Novedad", traffic: "Incidente",
        domestic: "Incidente", theft: "Incidente", assault: "Incidente",
    };

    const payload: Record<string, any> = {};
    if (data.status) payload.Status = data.status;
    if (data.status) payload.Estado = estadoMap[data.status] ?? undefined;
    if (data.priority) payload.Prioridad = prioridadMap[data.priority] ?? data.priority;
    if (data.type) payload.Tipo = tipoMap[data.type] ?? data.type;
    if (data.description) payload.Descripcion = data.description;
    if (data.location) payload.Location = data.location;
    if (data.assignedOfficerId !== undefined)
        payload.AssignedOfficerId = data.assignedOfficerId;
    if (data.beatId !== undefined)
        payload.BeatId = data.beatId;
    if (data.notes !== undefined) payload.Notes = data.notes;

    const res = await fetchAPI(`/api/reportes/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text());
    return mapReporte(await res.json());
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const [statsRes, agentesRes] = await Promise.all([
        fetchAPI("/api/dashboard/estadisticas"),
        fetchAPI("/api/dashboard/agentes-activos"),
    ]);
    const stats = statsRes.ok ? await statsRes.json() : {};
    const agentes = agentesRes.ok ? await agentesRes.json() : [];

    const totalAgentes = prop(stats, "totalAgentes", "TotalAgentes") ?? 0;
    const turnosHoy = prop(stats, "turnosHoy", "TurnosHoy") ?? 0;
    const onDuty = agentes.length;
    const offDuty = Math.max(0, totalAgentes - onDuty);

    return { onDuty, offDuty, gaps: 0, todayShifts: turnosHoy };
}

export async function createShiftPattern(params: {
    officerId: string;
    beatId: string;
    shiftType: "diurno" | "vespertino_lj" | "vespertino_vd" | "nocturno";
    startDate: string;
    endDate: string;
    notes?: string;
}): Promise<number> {
    const { officerId, beatId, shiftType, startDate, endDate, notes } = params;

    const agenteId = Number(officerId);
    const cuadranteId = Number(beatId);
    if (!agenteId || agenteId <= 0) throw new Error("Oficial inválido");
    if (!cuadranteId || cuadranteId <= 0) throw new Error("Cuadrante inválido");

    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    if (end < start) throw new Error("La fecha de fin debe ser posterior a la de inicio");

    const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
    if (diffDays > 180) throw new Error("El período máximo es de 180 días");

    const CONFIGS = {
        diurno: { startTime: "07:00", endTime: "18:00", crossesMidnight: false },
        vespertino_lj: { startTime: "18:00", endTime: "07:00", crossesMidnight: true },
        vespertino_vd: { startTime: "18:00", endTime: "07:00", crossesMidnight: true },
        nocturno: { startTime: "22:00", endTime: "06:00", crossesMidnight: true },
    };
    const cfg = CONFIGS[shiftType];

    const dates: string[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
        const dow = cursor.getDay();
        let include = false;

        if (shiftType === "diurno") include = true;
        else if (shiftType === "vespertino_lj") include = dow >= 1 && dow <= 4;
        else if (shiftType === "vespertino_vd") include = dow === 5 || dow === 6 || dow === 0;
        else if (shiftType === "nocturno") include = dates.length % 2 === 0;

        if (include) dates.push(cursor.toISOString().split("T")[0]);
        cursor.setDate(cursor.getDate() + 1);
    }

    if (dates.length === 0) throw new Error("Ningún día del período cumple con el patrón seleccionado");

    let created = 0;
    for (const date of dates) {
        const endDate = cfg.crossesMidnight
            ? (() => { const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })()
            : date;

        const payload = {
            ID_Agente: agenteId,
            ID_Cuadrante: cuadranteId,
            FechaProgramadaInicio: `${date}T${cfg.startTime}:00`,
            FechaProgramadaFin: `${endDate}T${cfg.endTime}:00`,
            TipoTurno: shiftType,
            Observaciones: notes ?? null,
        };

        const res = await fetchAPI("/api/turnos", { method: "POST", body: JSON.stringify(payload) });
        if (res.ok) created++;
    }

    if (created === 0) throw new Error("No se pudo crear ningún turno. Verifica los datos.");
    return created;
}

export async function deleteShift(compositeId: string): Promise<void> {
    const isHorario = compositeId.startsWith("h_");
    const id = compositeId.replace("t_", "").replace("h_", "");
    const endpoint = isHorario ? `/api/horarios/${id}` : `/api/turnos/${id}`;

    const res = await fetchAPI(endpoint, { method: "DELETE" });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error eliminando " + (isHorario ? "horario" : "turno"));
    }
}
