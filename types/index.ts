export interface Medication {
  id: string;
  name: string;
  description?: string;
  schedule: Schedule[];
  createdAt: number;
  updatedAt: number;
}

export interface Schedule {
  id: string;
  time: string; // Format: "HH:mm"
  days: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
}

export interface NotificationTime {
  hour: number;
  minute: number;
}