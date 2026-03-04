import { randomUUID } from "crypto";
import { 
  officers, type Officer, type InsertOfficer,
  beats, type Beat, type InsertBeat,
  shifts, type Shift, type InsertShift,
  shiftRequests, type ShiftRequest, type InsertShiftRequest,
  emergencyReports, type EmergencyReport, type InsertEmergencyReport
} from "@shared/schema";

export interface IStorage {
  getOfficers(): Promise<Officer[]>;
  getOfficer(id: string): Promise<Officer | undefined>;
  createOfficer(officer: InsertOfficer): Promise<Officer>;
  updateOfficer(id: string, officer: Partial<Officer>): Promise<Officer | undefined>;
  deleteOfficer(id: string): Promise<boolean>;
  
  getBeats(): Promise<Beat[]>;
  getBeat(id: string): Promise<Beat | undefined>;
  createBeat(beat: InsertBeat): Promise<Beat>;
  updateBeat(id: string, beat: Partial<Beat>): Promise<Beat | undefined>;
  
  getShifts(): Promise<Shift[]>;
  getShift(id: string): Promise<Shift | undefined>;
  getShiftsByDateRange(startDate: string, endDate: string): Promise<Shift[]>;
  getShiftsByOfficer(officerId: string): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: string, shift: Partial<Shift>): Promise<Shift | undefined>;
  deleteShift(id: string): Promise<boolean>;
  
  getShiftRequests(): Promise<ShiftRequest[]>;
  getShiftRequest(id: string): Promise<ShiftRequest | undefined>;
  createShiftRequest(request: InsertShiftRequest): Promise<ShiftRequest>;
  updateShiftRequest(id: string, request: Partial<ShiftRequest>): Promise<ShiftRequest | undefined>;
  
  getEmergencyReports(): Promise<EmergencyReport[]>;
  getEmergencyReport(id: string): Promise<EmergencyReport | undefined>;
  createEmergencyReport(report: InsertEmergencyReport): Promise<EmergencyReport>;
  updateEmergencyReport(id: string, report: Partial<EmergencyReport>): Promise<EmergencyReport | undefined>;
  getReportsByStatus(status: string): Promise<EmergencyReport[]>;
  getReportsByPriority(priority: string): Promise<EmergencyReport[]>;
}

export class MemStorage implements IStorage {
  private officers: Map<string, Officer>;
  private beats: Map<string, Beat>;
  private shifts: Map<string, Shift>;
  private shiftRequests: Map<string, ShiftRequest>;
  private emergencyReports: Map<string, EmergencyReport>;

  constructor() {
    this.officers = new Map();
    this.beats = new Map();
    this.shifts = new Map();
    this.shiftRequests = new Map();
    this.emergencyReports = new Map();
    this.initializeData();
  }

  initializeData() {
    const sampleOfficers = [
      { name: "Carlos Mendoza", cedula: "8-123-456", email: "carlos.mendoza@policia.gob", badge: "P001", rank: "Sargento", status: "on_duty", phone: "+507 6234-5678", circunscripcion: 1, puestoAsignado: "Patrullero" },
      { name: "María Elena Santos", cedula: "8-234-567", email: "maria.santos@policia.gob", badge: "P002", rank: "Cabo", status: "on_duty", phone: "+507 6345-6789", circunscripcion: 2, puestoAsignado: "Palacio" },
      { name: "José Rodríguez", cedula: "8-345-678", email: "jose.rodriguez@policia.gob", badge: "P003", rank: "Oficial", status: "on_duty", phone: "+507 6456-7890", circunscripcion: 1, puestoAsignado: "Puesto Fijo" },
      { name: "Ana Lucía Herrera", cedula: "8-456-789", email: "ana.herrera@policia.gob", badge: "P004", rank: "Teniente", status: "on_duty", phone: "+507 6567-8901", circunscripcion: 3, puestoAsignado: "Patrullero" },
      { name: "Roberto Castillo", cedula: "8-567-890", email: "roberto.castillo@policia.gob", badge: "P005", rank: "Cabo", status: "on_duty", phone: "+507 6678-9012", circunscripcion: 2, puestoAsignado: "Puesto Fijo" },
      { name: "Sofía Martínez", cedula: "8-678-901", email: "sofia.martinez@policia.gob", badge: "P006", rank: "Oficial", status: "off_duty", phone: "+507 6789-0123", circunscripcion: 3, puestoAsignado: "Palacio" },
    ];

    sampleOfficers.forEach(officer => {
      const id = randomUUID();
      this.officers.set(id, {
        id,
        ...officer,
        createdAt: new Date(),
      });
    });

    const sampleBeats = [
      { name: "Cuadrante 1", description: "Sector Centro - Circunscripción 1", circunscripcion: 1, cuadrante: 1, active: true },
      { name: "Cuadrante 2", description: "Sector Norte - Circunscripción 1", circunscripcion: 1, cuadrante: 2, active: true },
      { name: "Cuadrante 7", description: "Sector Histórico - Circunscripción 1", circunscripcion: 1, cuadrante: 7, active: true },
      { name: "Cuadrante 5", description: "Sector Este - Circunscripción 2", circunscripcion: 2, cuadrante: 5, active: true },
      { name: "Cuadrante 6", description: "Sector Comercial - Circunscripción 2", circunscripcion: 2, cuadrante: 6, active: true },
      { name: "Cuadrante 3", description: "Sector Sur - Circunscripción 3", circunscripcion: 3, cuadrante: 3, active: true },
      { name: "Cuadrante 4", description: "Sector Oeste - Circunscripción 3", circunscripcion: 3, cuadrante: 4, active: true },
    ];

    sampleBeats.forEach(beat => {
      const id = randomUUID();
      this.beats.set(id, { id, ...beat });
    });

    const today = new Date().toISOString().split('T')[0];
    const officerIds = Array.from(this.officers.keys());
    const beatIds = Array.from(this.beats.keys());

    const sampleShifts = [
      {
        officerId: officerIds[0],
        beatId: beatIds[0],
        date: today,
        shiftType: "diurno",
        startTime: "07:00",
        endTime: "18:00",
        status: "active",
        notes: "Turno diurno - patrullaje regular"
      },
      {
        officerId: officerIds[1],
        beatId: beatIds[1],
        date: today,
        shiftType: "nocturno",
        startTime: "18:00",
        endTime: "07:00",
        status: "scheduled",
        notes: "Turno nocturno - vigilancia nocturna"
      },
    ];

    sampleShifts.forEach(shift => {
      const id = randomUUID();
      this.shifts.set(id, {
        id,
        ...shift,
        createdAt: new Date(),
      });
    });

    this.initializeEmergencyReports();
  }

  initializeEmergencyReports() {
    const sampleReports = [
      {
        reportNumber: "RPT-2025-001",
        type: "emergency",
        priority: "high",
        status: "pending",
        description: "Alarma de robo activada en banco central",
        location: "Calle Principal 123, Centro",
        callerName: "Sistema de Seguridad Bancario",
        callerPhone: "911-ALARM",
        assignedOfficerId: null,
        beatId: null,
        notes: null
      },
      {
        reportNumber: "RPT-2025-002", 
        type: "traffic",
        priority: "medium",
        status: "assigned",
        description: "Accidente vehicular con heridos leves",
        location: "Av. Libertad esquina 5ta Calle",
        callerName: "María González",
        callerPhone: "555-0234",
        assignedOfficerId: Array.from(this.officers.keys())[0],
        beatId: Array.from(this.beats.keys())[1],
        notes: "Ambulancia en camino"
      },
      {
        reportNumber: "RPT-2025-003",
        type: "domestic",
        priority: "high", 
        status: "in_progress",
        description: "Disturbio doméstico con amenazas",
        location: "Residencial Los Pinos, Casa 45",
        callerName: "Vecino Anónimo",
        callerPhone: "555-0567",
        assignedOfficerId: Array.from(this.officers.keys())[1],
        beatId: Array.from(this.beats.keys())[0],
        notes: "Oficial en sitio"
      },
      {
        reportNumber: "RPT-2025-004",
        type: "theft",
        priority: "medium",
        status: "pending",
        description: "Robo de vehículo reportado",
        location: "Estacionamiento Centro Comercial Plaza",
        callerName: "Carlos Mendoza",
        callerPhone: "555-0890",
        assignedOfficerId: null,
        beatId: null,
        notes: null
      },
      {
        reportNumber: "RPT-2025-005",
        type: "non_emergency",
        priority: "low",
        status: "resolved",
        description: "Ruido excesivo en edificio residencial",
        location: "Edificio Aurora, Apto 302",
        callerName: "Ana Pérez",
        callerPhone: "555-0123",
        assignedOfficerId: Array.from(this.officers.keys())[2],
        beatId: Array.from(this.beats.keys())[2],
        notes: "Situación resuelta sin incidentes"
      }
    ];

    sampleReports.forEach(report => {
      const id = randomUUID();
      const now = new Date();
      this.emergencyReports.set(id, {
        id,
        ...report,
        reportedAt: new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000),
        assignedAt: report.assignedOfficerId ? new Date(now.getTime() - Math.random() * 60 * 60 * 1000) : null,
        resolvedAt: report.status === 'resolved' ? new Date(now.getTime() - Math.random() * 30 * 60 * 1000) : null,
      });
    });
  }

  async getOfficers(): Promise<Officer[]> {
    return Array.from(this.officers.values());
  }

  async getOfficer(id: string): Promise<Officer | undefined> {
    return this.officers.get(id);
  }

  async createOfficer(insertOfficer: InsertOfficer): Promise<Officer> {
    const id = randomUUID();
    const officer: Officer = {
      ...insertOfficer,
      id,
      status: insertOfficer.status || "off_duty",
      phone: insertOfficer.phone || null,
      createdAt: new Date(),
    };
    this.officers.set(id, officer);
    return officer;
  }

  async updateOfficer(id: string, officer: Partial<Officer>): Promise<Officer | undefined> {
    const existing = this.officers.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...officer };
    this.officers.set(id, updated);
    return updated;
  }

  async deleteOfficer(id: string): Promise<boolean> {
    return this.officers.delete(id);
  }

  async getBeats(): Promise<Beat[]> {
    return Array.from(this.beats.values());
  }

  async getBeat(id: string): Promise<Beat | undefined> {
    return this.beats.get(id);
  }

  async createBeat(insertBeat: InsertBeat): Promise<Beat> {
    const id = randomUUID();
    const beat: Beat = { 
      ...insertBeat, 
      id,
      description: insertBeat.description || null,
      active: insertBeat.active !== undefined ? insertBeat.active : true
    };
    this.beats.set(id, beat);
    return beat;
  }

  async updateBeat(id: string, beat: Partial<Beat>): Promise<Beat | undefined> {
    const existing = this.beats.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...beat };
    this.beats.set(id, updated);
    return updated;
  }

  async getShifts(): Promise<Shift[]> {
    return Array.from(this.shifts.values());
  }

  async getShift(id: string): Promise<Shift | undefined> {
    return this.shifts.get(id);
  }

  async getShiftsByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(
      shift => shift.date >= startDate && shift.date <= endDate
    );
  }

  async getShiftsByOfficer(officerId: string): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(
      shift => shift.officerId === officerId
    );
  }

  async createShift(insertShift: InsertShift): Promise<Shift> {
    const id = randomUUID();
    const shift: Shift = {
      ...insertShift,
      id,
      status: insertShift.status || "scheduled",
      officerId: insertShift.officerId || null,
      beatId: insertShift.beatId || null,
      notes: insertShift.notes || null,
      createdAt: new Date(),
    };
    this.shifts.set(id, shift);
    return shift;
  }

  async updateShift(id: string, shift: Partial<Shift>): Promise<Shift | undefined> {
    const existing = this.shifts.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...shift };
    this.shifts.set(id, updated);
    return updated;
  }

  async deleteShift(id: string): Promise<boolean> {
    return this.shifts.delete(id);
  }

  async getShiftRequests(): Promise<ShiftRequest[]> {
    return Array.from(this.shiftRequests.values());
  }

  async getShiftRequest(id: string): Promise<ShiftRequest | undefined> {
    return this.shiftRequests.get(id);
  }

  async createShiftRequest(insertRequest: InsertShiftRequest): Promise<ShiftRequest> {
    const id = randomUUID();
    const request: ShiftRequest = {
      ...insertRequest,
      id,
      status: insertRequest.status || "pending",
      targetOfficerId: insertRequest.targetOfficerId || null,
      shiftId: insertRequest.shiftId || null,
      createdAt: new Date(),
      respondedAt: null,
    };
    this.shiftRequests.set(id, request);
    return request;
  }

  async updateShiftRequest(id: string, request: Partial<ShiftRequest>): Promise<ShiftRequest | undefined> {
    const existing = this.shiftRequests.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...request,
      respondedAt: (request.status && request.status !== 'pending') ? new Date() : existing.respondedAt
    };
    this.shiftRequests.set(id, updated);
    return updated;
  }

  async getEmergencyReports(): Promise<EmergencyReport[]> {
    return Array.from(this.emergencyReports.values()).sort((a, b) => 
      new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
  }

  async getEmergencyReport(id: string): Promise<EmergencyReport | undefined> {
    return this.emergencyReports.get(id);
  }

  async createEmergencyReport(insertReport: InsertEmergencyReport): Promise<EmergencyReport> {
    const id = randomUUID();
    const reportNumber = `RPT-${new Date().getFullYear()}-${String(this.emergencyReports.size + 1).padStart(3, '0')}`;
    const report: EmergencyReport = {
      ...insertReport,
      id,
      reportNumber: insertReport.reportNumber || reportNumber,
      status: insertReport.status || "pending",
      assignedOfficerId: insertReport.assignedOfficerId || null,
      beatId: insertReport.beatId || null,
      callerName: insertReport.callerName || null,
      callerPhone: insertReport.callerPhone || null,
      notes: insertReport.notes || null,
      reportedAt: new Date(),
      assignedAt: null,
      resolvedAt: null,
    };
    this.emergencyReports.set(id, report);
    return report;
  }

  async updateEmergencyReport(id: string, report: Partial<EmergencyReport>): Promise<EmergencyReport | undefined> {
    const existing = this.emergencyReports.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...report,
      assignedAt: (report.assignedOfficerId && !existing.assignedAt) ? new Date() : existing.assignedAt,
      resolvedAt: (report.status === 'resolved' && !existing.resolvedAt) ? new Date() : existing.resolvedAt
    };
    this.emergencyReports.set(id, updated);
    return updated;
  }

  async getReportsByStatus(status: string): Promise<EmergencyReport[]> {
    return Array.from(this.emergencyReports.values()).filter(report => report.status === status);
  }

  async getReportsByPriority(priority: string): Promise<EmergencyReport[]> {
    return Array.from(this.emergencyReports.values()).filter(report => report.priority === priority);
  }
}

export const storage = new MemStorage();
