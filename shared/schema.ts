import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const officers = pgTable("officers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cedula: text("cedula").notNull().unique(),
  email: text("email").notNull().unique(),
  badge: text("badge").notNull().unique(),
  rank: text("rank").notNull(),
  status: text("status").notNull().default("off_duty"), // on_duty, off_duty, unavailable
  phone: text("phone"),
  circunscripcion: integer("circunscripcion").notNull(), // 1-3
  puestoAsignado: text("puesto_asignado").notNull(), // Palacio, Patrullero, Puesto Fijo
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const beats = pgTable("beats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  circunscripcion: integer("circunscripcion").notNull(), // 1-3
  cuadrante: integer("cuadrante").notNull(), // 1-7
  active: boolean("active").default(true).notNull(),
});

export const shifts = pgTable("shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officerId: varchar("officer_id").references(() => officers.id),
  beatId: varchar("beat_id").references(() => beats.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  shiftType: text("shift_type").notNull(), // diurno, nocturno
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  status: text("status").notNull().default("scheduled"), // scheduled, active, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shiftRequests = pgTable("shift_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestType: text("request_type").notNull(), // swap, time_off, coverage
  requesterId: varchar("requester_id").references(() => officers.id).notNull(),
  targetOfficerId: varchar("target_officer_id").references(() => officers.id),
  shiftId: varchar("shift_id").references(() => shifts.id),
  details: text("details").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
});

export const emergencyReports = pgTable("emergency_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: text("report_number").notNull().unique(),
  type: text("type").notNull(), // emergency, non_emergency, traffic, domestic, theft, assault
  priority: text("priority").notNull(), // high, medium, low
  status: text("status").notNull().default("pending"), // pending, assigned, in_progress, resolved, closed
  description: text("description").notNull(),
  location: text("location").notNull(),
  callerName: text("caller_name"),
  callerPhone: text("caller_phone"),
  assignedOfficerId: varchar("assigned_officer_id").references(() => officers.id),
  beatId: varchar("beat_id").references(() => beats.id),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
  assignedAt: timestamp("assigned_at"),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
});

export const insertOfficerSchema = createInsertSchema(officers).omit({
  id: true,
  createdAt: true,
});

export const insertBeatSchema = createInsertSchema(beats).omit({
  id: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
});

export const insertShiftRequestSchema = createInsertSchema(shiftRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export const insertEmergencyReportSchema = createInsertSchema(emergencyReports).omit({
  id: true,
  reportedAt: true,
  assignedAt: true,
  resolvedAt: true,
});

export type Officer = typeof officers.$inferSelect;
export type Beat = typeof beats.$inferSelect;
export type Shift = typeof shifts.$inferSelect;
export type ShiftRequest = typeof shiftRequests.$inferSelect;
export type EmergencyReport = typeof emergencyReports.$inferSelect;
export type InsertOfficer = z.infer<typeof insertOfficerSchema>;
export type InsertBeat = z.infer<typeof insertBeatSchema>;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type InsertShiftRequest = z.infer<typeof insertShiftRequestSchema>;
export type InsertEmergencyReport = z.infer<typeof insertEmergencyReportSchema>;
