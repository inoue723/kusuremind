import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Medications table
export const medications = sqliteTable('medications', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Medication schedules table
export const medicationSchedules = sqliteTable('medication_schedules', {
  id: text('id').primaryKey(),
  medicationId: text('medication_id')
    .notNull()
    .references(() => medications.id, { onDelete: 'cascade' }),
  time: text('time').notNull(), // Format: "HH:mm"
  days: text('days').notNull(), // JSON string of days array [0-6]
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
});

// Medication taking records table
export const medicationTakingRecords = sqliteTable('medication_taking_records', {
  id: text('id').primaryKey(),
  medicationId: text('medication_id')
    .notNull()
    .references(() => medications.id, { onDelete: 'cascade' }),
  medicationScheduleId: text('medication_schedule_id')
    .notNull()
    .references(() => medicationSchedules.id, { onDelete: 'cascade' }),
  scheduledDate: text('scheduled_date').notNull(), // Format: "YYYY-MM-DD"
  consumedAt: integer('consumed_at').notNull(),
});

// Types for the database schema
export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;

export type MedicationSchedule = typeof medicationSchedules.$inferSelect;
export type NewMedicationSchedule = typeof medicationSchedules.$inferInsert;

export type MedicationTakingRecord = typeof medicationTakingRecords.$inferSelect;
export type NewMedicationTakingRecord = typeof medicationTakingRecords.$inferInsert;