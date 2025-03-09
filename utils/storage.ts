import { eq, and } from 'drizzle-orm';
import { db, medications, medicationSchedules, medicationTakingRecords } from './db';
import { Medication, MedicationSchedule, MedicationTakingRecord } from '@/types';

// Helper function to convert database medication to app medication
const convertDbMedicationToAppMedication = async (
  dbMedication: any
): Promise<Medication> => {
  // Get schedules for this medication
  const dbSchedules = await db
    .select()
    .from(medicationSchedules)
    .where(eq(medicationSchedules.medicationId, dbMedication.id));

  // Convert schedules to app format
  const schedules: MedicationSchedule[] = dbSchedules.map((schedule) => ({
    id: schedule.id,
    medicationId: schedule.medicationId,
    time: schedule.time,
    days: JSON.parse(schedule.days),
    enabled: schedule.enabled,
  }));

  // Return the medication with schedules and records
  return {
    id: dbMedication.id,
    name: dbMedication.name,
    description: dbMedication.description,
    schedule: schedules,
    createdAt: dbMedication.createdAt,
    updatedAt: dbMedication.updatedAt,
  };
};

export const saveMedications = async (medications: Medication[]): Promise<void> => {
  try {
    // This function is not directly used with SQLite/Drizzle as we'll handle
    // individual medication operations separately
    for (const medication of medications) {
      await updateMedication(medication);
    }
  } catch (error) {
    console.error('Error saving medications:', error);
    throw error;
  }
};

export const getMedications = async (): Promise<Medication[]> => {
  try {
    // Get all medications from the database
    const dbMedications = await db.select().from(medications);
    
    // Convert each medication to app format
    const appMedications: Medication[] = [];
    for (const dbMedication of dbMedications) {
      const appMedication = await convertDbMedicationToAppMedication(dbMedication);
      appMedications.push(appMedication);
    }
    
    return appMedications;
  } catch (error) {
    console.error('Error getting medications:', error);
    return [];
  }
};

export const addMedication = async (medication: Medication): Promise<void> => {
  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      // Insert the medication
      await tx.insert(medications).values({
        id: medication.id,
        name: medication.name,
        description: medication.description,
        createdAt: medication.createdAt,
        updatedAt: medication.updatedAt,
      });

      // Insert the schedules
      for (const schedule of medication.schedule) {
        await tx.insert(medicationSchedules).values({
          id: schedule.id,
          medicationId: medication.id,
          time: schedule.time,
          days: JSON.stringify(schedule.days),
          enabled: schedule.enabled,
        });
      }

      // Insert any records if they exist
      if (medication.medicationRecords && medication.medicationRecords.length > 0) {
        for (const record of medication.medicationRecords) {
          await tx.insert(medicationTakingRecords).values({
            medicationScheduleId: record.medicationScheduleId,
            scheduledDate: record.scheduledDate,
            consumedAt: record.consumedAt,
          });
        }
      }
    });
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

export const updateMedication = async (updatedMedication: Medication): Promise<void> => {
  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      // Check if medication exists
      const existingMedication = await tx
        .select()
        .from(medications)
        .where(eq(medications.id, updatedMedication.id));

      if (existingMedication.length === 0) {
        throw new Error('Medication not found');
      }

      // Update the medication
      await tx
        .update(medications)
        .set({
          name: updatedMedication.name,
          description: updatedMedication.description,
          updatedAt: updatedMedication.updatedAt,
        })
        .where(eq(medications.id, updatedMedication.id));

      // Delete existing schedules
      await tx
        .delete(medicationSchedules)
        .where(eq(medicationSchedules.medicationId, updatedMedication.id));

      // Insert updated schedules
      for (const schedule of updatedMedication.schedule) {
        await tx.insert(medicationSchedules).values({
          id: schedule.id,
          medicationId: updatedMedication.id,
          time: schedule.time,
          days: JSON.stringify(schedule.days),
          enabled: schedule.enabled,
        });
      }
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

export const deleteMedication = async (id: string): Promise<void> => {
  try {
    // Delete the medication (cascade will delete related schedules and records)
    await db.delete(medications).where(eq(medications.id, id));
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
};

export const recordMedicationConsumption = async (
  medicationId: string,
  medicationRecord: MedicationTakingRecord
): Promise<void> => {
  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      // Check if medication exists
      const existingMedication = await tx
        .select()
        .from(medications)
        .where(eq(medications.id, medicationId));

      if (existingMedication.length === 0) {
        throw new Error('Medication not found');
      }

      // Insert the record
      await tx.insert(medicationTakingRecords).values({
        medicationScheduleId: medicationRecord.medicationScheduleId,
        scheduledDate: medicationRecord.scheduledDate,
        consumedAt: medicationRecord.consumedAt,
      });

      // Update the medication's updatedAt timestamp
      await tx
        .update(medications)
        .set({
          updatedAt: Date.now(),
        })
        .where(eq(medications.id, medicationId));
    });
  } catch (error) {
    console.error('Error recording medication consumption:', error);
    throw error;
  }
};
