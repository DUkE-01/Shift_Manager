import { z } from "zod";

// ─── Officer (Agente) ────────────────────────────────────────────────────────
export const insertOfficerSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    cedula: z.string().min(1, "La cédula es requerida"),
    badge: z.string().min(1, "El código de agente es requerido"),
    rank: z.string().min(1, "El rango es requerido"),
    phone: z.string().optional(),
    circunscripcion: z.number().int().min(1).max(3),
    puestoAsignado: z.enum(["Palacio", "Patrullero", "Puesto Fijo"]),
    status: z.enum(["on_duty", "off_duty", "unavailable"]).default("off_duty"),
    email: z.string().optional(),
});

export type Officer = {
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
};

// ─── Beat (Cuadrante) ────────────────────────────────────────────────────────
export const insertBeatSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
    circunscripcion: z.number().int().min(1).max(3),
    cuadrante: z.number().int().min(1).max(7),
    active: z.boolean().default(true),
});

export type Beat = {
    id: string;
    name: string;
    description?: string;
    circunscripcion: number;
    cuadrante: number;
    active: boolean;
};

// ─── Shift (Turno/Horario) ───────────────────────────────────────────────────
export const insertShiftSchema = z.object({
    officerId: z.string().optional(),
    beatId: z.string().optional(),
    date: z.string().min(1, "La fecha es requerida"),
    shiftType: z.enum(["diurno", "nocturno"]),
    startTime: z.string().min(1, "La hora de inicio es requerida"),
    endTime: z.string().min(1, "La hora de fin es requerida"),
    status: z.enum(["scheduled", "active", "completed", "cancelled"]).default("scheduled"),
    notes: z.string().optional(),
});

export type Shift = {
    id: string;
    officerId?: string;
    beatId?: string;
    date: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    status: string;
    notes?: string;
    createdAt: string;
};

// ─── ShiftRequest ────────────────────────────────────────────────────────────
export const insertShiftRequestSchema = z.object({
    requestType: z.enum(["swap", "time_off", "coverage"]),
    requesterId: z.string().min(1),
    targetOfficerId: z.string().optional(),
    shiftId: z.string().optional(),
    details: z.string().min(1, "Los detalles son requeridos"),
    status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

export type ShiftRequest = {
    id: string;
    requestType: string;
    requesterId: string;
    targetOfficerId?: string;
    shiftId?: string;
    details: string;
    status: string;
    createdAt: string;
    respondedAt?: string;
};

// ─── EmergencyReport (Reporte) ───────────────────────────────────────────────
export const insertEmergencyReportSchema = z.object({
    reportNumber: z.string().min(1, "El número de reporte es requerido"),
    type: z.enum(["emergency", "non_emergency", "traffic", "domestic", "theft", "assault"]),
    priority: z.enum(["high", "medium", "low"]),
    description: z.string().min(1, "La descripción es requerida"),
    location: z.string().min(1, "La ubicación es requerida"),
    callerName: z.string().optional(),
    callerPhone: z.string().optional(),
    assignedOfficerId: z.string().optional(),
    beatId: z.string().optional(),
    status: z.enum(["pending", "assigned", "in_progress", "resolved", "closed"]).default("pending"),
    notes: z.string().optional(),
});

export type EmergencyReport = {
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
};

// ─── Insert types ─────────────────────────────────────────────────────────────
export type InsertOfficer = z.infer<typeof insertOfficerSchema>;
export type InsertBeat = z.infer<typeof insertBeatSchema>;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type InsertShiftRequest = z.infer<typeof insertShiftRequestSchema>;
export type InsertEmergencyReport = z.infer<typeof insertEmergencyReportSchema>;

// ─── DashboardStats ───────────────────────────────────────────────────────────
export type DashboardStats = {
    onDuty: number;
    offDuty: number;
    gaps: number;
    todayShifts: number;
};