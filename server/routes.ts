import { createServer } from "http";
import { storage } from "./storage";
import { insertOfficerSchema, insertShiftSchema, insertShiftRequestSchema, insertBeatSchema, insertEmergencyReportSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app) {
  // Officers routes
  app.get("/api/officers", async (req, res) => {
    try {
      const officers = await storage.getOfficers();
      res.json(officers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch officers" });
    }
  });

  app.get("/api/officers/:id", async (req, res) => {
    try {
      const officer = await storage.getOfficer(req.params.id);
      if (!officer) {
        return res.status(404).json({ message: "Officer not found" });
      }
      res.json(officer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch officer" });
    }
  });

  app.post("/api/officers", async (req, res) => {
    try {
      const validatedData = insertOfficerSchema.parse(req.body);
      const officer = await storage.createOfficer(validatedData);
      res.status(201).json(officer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid officer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create officer" });
    }
  });

  app.patch("/api/officers/:id", async (req, res) => {
    try {
      const validatedData = insertOfficerSchema.partial().parse(req.body);
      const officer = await storage.updateOfficer(req.params.id, validatedData);
      if (!officer) {
        return res.status(404).json({ message: "Officer not found" });
      }
      res.json(officer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid officer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update officer" });
    }
  });

  // Beats routes
  app.get("/api/beats", async (req, res) => {
    try {
      const beats = await storage.getBeats();
      res.json(beats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch beats" });
    }
  });

  app.post("/api/beats", async (req, res) => {
    try {
      const validatedData = insertBeatSchema.parse(req.body);
      const beat = await storage.createBeat(validatedData);
      res.status(201).json(beat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid beat data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create beat" });
    }
  });

  // Shifts routes
  app.get("/api/shifts", async (req, res) => {
    try {
      const { startDate, endDate, officerId } = req.query;
      
      if (officerId && typeof officerId === 'string') {
        const shifts = await storage.getShiftsByOfficer(officerId);
        return res.json(shifts);
      }
      
      if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
        const shifts = await storage.getShiftsByDateRange(startDate, endDate);
        return res.json(shifts);
      }
      
      const shifts = await storage.getShifts();
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.post("/api/shifts", async (req, res) => {
    try {
      const validatedData = insertShiftSchema.parse(req.body);
      const shift = await storage.createShift(validatedData);
      res.status(201).json(shift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shift data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create shift" });
    }
  });

  app.patch("/api/shifts/:id", async (req, res) => {
    try {
      const validatedData = insertShiftSchema.partial().parse(req.body);
      const shift = await storage.updateShift(req.params.id, validatedData);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.json(shift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shift data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update shift" });
    }
  });

  app.delete("/api/shifts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteShift(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  // Shift requests routes
  app.get("/api/shift-requests", async (req, res) => {
    try {
      const requests = await storage.getShiftRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shift requests" });
    }
  });

  app.post("/api/shift-requests", async (req, res) => {
    try {
      const validatedData = insertShiftRequestSchema.parse(req.body);
      const request = await storage.createShiftRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create shift request" });
    }
  });

  app.patch("/api/shift-requests/:id", async (req, res) => {
    try {
      const validatedData = insertShiftRequestSchema.partial().parse(req.body);
      const request = await storage.updateShiftRequest(req.params.id, validatedData);
      if (!request) {
        return res.status(404).json({ message: "Shift request not found" });
      }
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update shift request" });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const officers = await storage.getOfficers();
      const today = new Date().toISOString().split('T')[0];
      const shifts = await storage.getShiftsByDateRange(today, today);
      const beats = await storage.getBeats();
      
      const onDuty = officers.filter(o => o.status === 'on_duty').length;
      const offDuty = officers.filter(o => o.status === 'off_duty').length;
      const todayShifts = shifts.length;
      
      // Calculate coverage gaps (beats without assigned shifts)
      const assignedBeats = new Set(shifts.map(s => s.beatId).filter(Boolean));
      const gaps = beats.filter(b => b.active && !assignedBeats.has(b.id)).length;

      res.json({
        onDuty,
        offDuty,
        todayShifts,
        gaps
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Emergency Reports routes
  app.get("/api/emergency-reports", async (req, res) => {
    try {
      const { status, priority } = req.query;
      
      if (status && typeof status === 'string') {
        const reports = await storage.getReportsByStatus(status);
        return res.json(reports);
      }
      
      if (priority && typeof priority === 'string') {
        const reports = await storage.getReportsByPriority(priority);
        return res.json(reports);
      }
      
      const reports = await storage.getEmergencyReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch emergency reports" });
    }
  });

  app.get("/api/emergency-reports/:id", async (req, res) => {
    try {
      const report = await storage.getEmergencyReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Emergency report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch emergency report" });
    }
  });

  app.post("/api/emergency-reports", async (req, res) => {
    try {
      const validatedData = insertEmergencyReportSchema.parse(req.body);
      const report = await storage.createEmergencyReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create emergency report" });
    }
  });

  app.patch("/api/emergency-reports/:id", async (req, res) => {
    try {
      const validatedData = insertEmergencyReportSchema.partial().parse(req.body);
      const report = await storage.updateEmergencyReport(req.params.id, validatedData);
      if (!report) {
        return res.status(404).json({ message: "Emergency report not found" });
      }
      res.json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update emergency report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
