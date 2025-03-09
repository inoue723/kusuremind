import React from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Schedule } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Generate hour options starting from 6:00 (6-23, then 0-5)
export const HOUR_OPTIONS = [
  ...Array.from({ length: 18 }, (_, i) => {
    const hour = (i + 6).toString().padStart(2, '0');
    return { label: `${hour}`, value: hour };
  }),
  ...Array.from({ length: 6 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { label: `${hour}`, value: hour };
  })
];

// Generate minute options (0-50, step 10)
export const MINUTE_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const minute = (i * 10).toString().padStart(2, '0');
  return { label: `${minute}`, value: minute };
});

export interface MedicationFormProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  onSave: () => void;
}

export function MedicationForm({
  name,
  setName,
  description,
  setDescription,
  schedules,
  setSchedules,
  onSave
}: MedicationFormProps) {
  const handleAddSchedule = () => {
    // Get medicationId from the first schedule if available, otherwise use a temporary ID
    const medicationId = schedules.length > 0
      ? schedules[0].medicationId
      : uuidv4();
      
    setSchedules([
      ...schedules,
      {
        id: uuidv4(),
        medicationId,
        time: '09:00',
        days: [0, 1, 2, 3, 4, 5, 6], // All days by default
        enabled: true,
      },
    ]);
  };

  const handleRemoveSchedule = (id: string) => {
    setSchedules(schedules.filter(schedule => schedule.id !== id));
  };

  const handleUpdateSchedule = (id: string, field: keyof Schedule, value: any) => {
    setSchedules(
      schedules.map(schedule => {
        if (schedule.id === id) {
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
              <View style={styles.timeSelectionContainer}>
                {/* Hour selection */}
                <View style={styles.timeSelectionSection}>
                  <Text style={styles.timeSelectionLabel}>時</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.timeOptionsContainer}
                  >
                    {HOUR_OPTIONS.map((option) => {
                      const currentHour = schedule.time.split(':')[0];
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.timeOption,
                            currentHour === option.value && styles.timeOptionSelected,
                          ]}
                          onPress={() => {
                            const currentMinute = schedule.time.split(':')[1];
                            handleUpdateSchedule(
                              schedule.id,
                              'time',
                              `${option.value}:${currentMinute}`
                            );
                          }}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              currentHour === option.value && styles.timeOptionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Minute selection */}
                <View style={styles.timeSelectionSection}>
                  <Text style={styles.timeSelectionLabel}>分</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.timeOptionsContainer}
                  >
                    {MINUTE_OPTIONS.map((option) => {
                      const currentMinute = schedule.time.split(':')[1];
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.timeOption,
                            currentMinute === option.value && styles.timeOptionSelected,
                          ]}
                          onPress={() => {
                            const currentHour = schedule.time.split(':')[0];
                            handleUpdateSchedule(
                              schedule.id,
                              'time',
                              `${currentHour}:${option.value}`
                            );
                          }}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              currentMinute === option.value && styles.timeOptionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
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

      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveButtonText}>保存</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export const styles = StyleSheet.create({
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
    color: '#000', // Ensure text is always visible
    backgroundColor: '#fff', // Ensure background is always white
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
  timeSelectionContainer: {
    marginBottom: 8,
  },
  timeSelectionSection: {
    marginBottom: 12,
  },
  timeSelectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeOptionsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeOption: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeOptionText: {
    fontSize: 14,
  },
  timeOptionTextSelected: {
    color: 'white',
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

export default MedicationForm;