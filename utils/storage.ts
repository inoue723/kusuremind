import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication } from '@/types';

const STORAGE_KEY = 'MEDICATIONS';

export const saveMedications = async (medications: Medication[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
  } catch (error) {
    console.error('Error saving medications:', error);
    throw error;
  }
};

export const getMedications = async (): Promise<Medication[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting medications:', error);
    return [];
  }
};

export const addMedication = async (medication: Medication): Promise<void> => {
  try {
    const medications = await getMedications();
    medications.push(medication);
    await saveMedications(medications);
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

export const updateMedication = async (updatedMedication: Medication): Promise<void> => {
  try {
    const medications = await getMedications();
    const index = medications.findIndex(med => med.id === updatedMedication.id);
    
    if (index !== -1) {
      medications[index] = updatedMedication;
      await saveMedications(medications);
    } else {
      throw new Error('Medication not found');
    }
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

export const deleteMedication = async (id: string): Promise<void> => {
  try {
    const medications = await getMedications();
    const filteredMedications = medications.filter(med => med.id !== id);
    await saveMedications(filteredMedications);
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
};