export interface Medication {
  id: string;
  name: string;
  description?: string;
  schedule: MedicationSchedule[];
  createdAt: number;
  updatedAt: number;
  usageHistories?: UsageHistory[];
}

export interface UsageHistory {
  id: string;
  timestamp: number;
  scheduleId: string;
  notes?: string;
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