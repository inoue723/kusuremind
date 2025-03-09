export interface Medication {
  id: string;
  name: string;
  description?: string;
  schedule: MedicationSchedule[];
  createdAt: number;
  updatedAt: number;
  medicationRecords?: MedicationTakingRecord[];
}

export interface MedicationTakingRecord {
  id: string;
  medicationScheduleId: string;
  scheduledDate: string; // Format: "YYYY-MM-DD"
  consumedAt: number; // Timestamp when the medication was actually taken
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  time: string; // Format: "HH:mm"
  days: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
}

export interface NotificationTime {
  hour: number;
  minute: number;
}