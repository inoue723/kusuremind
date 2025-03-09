import { useState } from 'react';
import { Alert } from 'react-native';
import { Medication, Schedule } from '@/types';
import { addMedication, updateMedication } from '@/utils/storage';
import { scheduleAllNotifications, cancelMedicationNotifications } from '@/utils/notifications';
import { router } from 'expo-router';

interface UseMedicationFormProps {
  initialMedication?: Medication;
  isEditing: boolean;
}

export function useMedicationForm({ initialMedication, isEditing }: UseMedicationFormProps) {
  const [name, setName] = useState(initialMedication?.name || '');
  const [description, setDescription] = useState(initialMedication?.description || '');
  const [schedules, setSchedules] = useState<Schedule[]>(
    initialMedication?.schedule || [
      {
        id: Date.now().toString(),
        time: '09:00',
        days: [0, 1, 2, 3, 4, 5, 6], // All days by default
        enabled: true,
      },
    ]
  );

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('エラー', '薬の名前を入力してください');
      return false;
    }

    if (schedules.length === 0) {
      Alert.alert('エラー', '少なくとも1つのスケジュールを追加してください');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (isEditing && initialMedication) {
        // Update existing medication
        const updatedMedication: Medication = {
          ...initialMedication,
          name,
          description: description.trim() || undefined,
          schedule: schedules,
          updatedAt: Date.now(),
        };

        // Cancel existing notifications and schedule new ones
        await cancelMedicationNotifications(initialMedication);
        await updateMedication(updatedMedication);
        await scheduleAllNotifications(updatedMedication);
        
        Alert.alert('成功', '薬が更新されました', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        // Add new medication
        const newMedication: Medication = {
          id: Date.now().toString(),
          name,
          description: description.trim() || undefined,
          schedule: schedules,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await addMedication(newMedication);
        await scheduleAllNotifications(newMedication);
        
        Alert.alert('成功', '薬が追加されました', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'saving'} medication:`, error);
      Alert.alert('エラー', `薬の${isEditing ? '更新' : '追加'}に失敗しました`);
    }
  };

  return {
    name,
    setName,
    description,
    setDescription,
    schedules,
    setSchedules,
    handleSave,
  };
}