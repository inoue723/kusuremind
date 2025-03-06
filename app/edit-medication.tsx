import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Medication, Schedule } from '@/types';
import { getMedications, updateMedication } from '@/utils/storage';
import { scheduleAllNotifications, cancelMedicationNotifications } from '@/utils/notifications';

export default function EditMedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [medication, setMedication] = useState<Medication | null>(null);

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

  const handleAddSchedule = () => {
    setSchedules([
      ...schedules,
      {
        id: Date.now().toString(),
        time: '09:00',
        days: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
      },
    ]);
  };

  const handleRemoveSchedule = (scheduleId: string) => {
    setSchedules(schedules.filter(schedule => schedule.id !== scheduleId));
  };

  const handleUpdateSchedule = (scheduleId: string, field: keyof Schedule, value: any) => {
    setSchedules(
      schedules.map(schedule => {
        if (schedule.id === scheduleId) {
          return { ...schedule, [field]: value };
        }
        return schedule;
      })
    );
  };

  const handleUpdateDays = (scheduleId: string, day: number, selected: boolean) => {
    setSchedules(
      schedules.map(schedule => {
        if (schedule.id === scheduleId) {
          const days = selected
            ? [...schedule.days, day]
            : schedule.days.filter(d => d !== day);
          return { ...schedule, days };
        }
        return schedule;
      })
    );
  };

  const handleSave = async () => {
    if (!medication) return;
    
    if (!name.trim()) {
      Alert.alert('エラー', '薬の名前を入力してください');
      return;
    }

    if (schedules.length === 0) {
      Alert.alert('エラー', '少なくとも1つのスケジュールを追加してください');
      return;
    }

    try {
      const updatedMedication: Medication = {
        ...medication,
        name,
        description: description.trim() || undefined,
        schedule: schedules,
        updatedAt: Date.now(),
      };

      // Cancel existing notifications and schedule new ones
      await cancelMedicationNotifications(medication);
      await updateMedication(updatedMedication);
      await scheduleAllNotifications(updatedMedication);
      
      Alert.alert('成功', '薬が更新されました', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating medication:', error);
      Alert.alert('エラー', '薬の更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>薬の名前</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="薬の名前を入力"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>説明 (任意)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="薬の説明を入力"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>服用スケジュール</Text>
        
        {schedules.map((schedule, index) => (
          <View key={schedule.id} style={styles.scheduleItem}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleTitle}>スケジュール {index + 1}</Text>
              {schedules.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveSchedule(schedule.id)}>
                  <FontAwesome name="trash" size={20} color="red" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.timeContainer}>
              <Text style={styles.label}>時間</Text>
              <TextInput
                style={styles.timeInput}
                value={schedule.time}
                onChangeText={(value) => handleUpdateSchedule(schedule.id, 'time', value)}
                placeholder="HH:MM"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={styles.daysContainer}>
              <Text style={styles.label}>曜日</Text>
              <View style={styles.daysRow}>
                {['日', '月', '火', '水', '木', '金', '土'].map((day, dayIndex) => (
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.dayButton,
                      schedule.days.includes(dayIndex) && styles.dayButtonSelected,
                    ]}
                    onPress={() => 
                      handleUpdateDays(schedule.id, dayIndex, !schedule.days.includes(dayIndex))
                    }
                  >
                    <Text
                      style={[
                        styles.dayText,
                        schedule.days.includes(dayIndex) && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={handleAddSchedule}>
          <Text style={styles.addButtonText}>+ スケジュールを追加</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>保存</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scheduleItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeContainer: {
    marginBottom: 16,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  daysContainer: {
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
  },
  dayTextSelected: {
    color: 'white',
  },
  addButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});