import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { View, Text } from '@/components/Themed';
import { router, useLocalSearchParams } from 'expo-router';
import { Medication } from '@/types';
import { getMedications } from '@/utils/storage';
import MedicationForm, { styles } from '@/components/MedicationForm';
import { useMedicationForm } from '@/hooks/useMedicationForm';

export default function EditMedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [medication, setMedication] = useState<Medication | null>(null);
  
  const {
    name,
    setName,
    description,
    setDescription,
    schedules,
    setSchedules,
    handleSave,
  } = useMedicationForm({
    initialMedication: medication || undefined,
    isEditing: true
  });

  useEffect(() => {
    const loadMedication = async () => {
      if (!id) {
        Alert.alert('エラー', '薬のIDが見つかりません');
        router.back();
        return;
      }

      try {
        const medications = await getMedications();
        const med = medications.find(m => m.id === id);
        
        if (!med) {
          Alert.alert('エラー', '薬が見つかりません');
          router.back();
          return;
        }

        setMedication(med);
        setName(med.name);
        setDescription(med.description || '');
        setSchedules([...med.schedule]);
      } catch (error) {
        console.error('Error loading medication:', error);
        Alert.alert('エラー', '薬の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadMedication();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  return (
    <MedicationForm
      name={name}
      setName={setName}
      description={description}
      setDescription={setDescription}
      schedules={schedules}
      setSchedules={setSchedules}
      onSave={handleSave}
    />
  );
}