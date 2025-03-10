import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Medication, MedicationSchedule, MedicationTakingRecord } from '@/types';
import { getMedications, recordMedicationConsumption, deleteMedicationTakingRecord, getMedicationTakingRecord } from '@/utils/storage';
import { getTodayMedications, formatTime, getDayNames } from '@/utils/notifications';
import { format } from 'date-fns';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// Interface for medication-schedule combination
interface MedicationScheduleItem {
  id: string; // Unique ID combining medication ID and schedule ID
  medication: Medication;
  schedule: MedicationSchedule;
  hasTakingRecord?: boolean; // Flag to indicate if a taking record exists
}

export default function TodayScreen() {
  const [medicationItems, setMedicationItems] = useState<MedicationScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Load medications when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadMedications = async () => {
        setLoading(true);
        try {
          const allMedications = await getMedications();
          const todayMeds = getTodayMedications(allMedications);
          
          // Create unique items for each medication-schedule combination
          const items: MedicationScheduleItem[] = [];
          const today = new Date();
          const dayOfWeek = today.getDay();
          const formattedDate = format(today, 'yyyy-MM-dd');
          
          for (const medication of todayMeds) {
            const todaySchedules = medication.schedule.filter(
              schedule => schedule.enabled && schedule.days.includes(dayOfWeek)
            );
            
            for (const schedule of todaySchedules) {
              // Check if there's a taking record for this schedule today
              const takingRecord = await getMedicationTakingRecord(
                schedule.id,
                formattedDate
              );
              
              items.push({
                id: `${medication.id}-${schedule.id}`,
                medication,
                schedule,
                hasTakingRecord: !!takingRecord
              });
            }
          }
          
          // Sort by time
          items.sort((a, b) => {
            return a.schedule.time.localeCompare(b.schedule.time);
          });
          
          setMedicationItems(items);
        } catch (error) {
          console.error('Error loading medications:', error);
          Alert.alert('エラー', '薬の読み込みに失敗しました');
        } finally {
          setLoading(false);
        }
      };

      loadMedications();
    }, [])
  );

  const handleTakeMedication = async (item: MedicationScheduleItem) => {
    try {
      const today = new Date();
      const formattedDate = format(today, 'yyyy-MM-dd');
      
      if (item.hasTakingRecord) {
        // Delete the existing record
        await deleteMedicationTakingRecord(
          item.medication.id,
          item.schedule.id,
          formattedDate
        );
        
        // Show success message
        Alert.alert(
          '服用記録',
          `${item.medication.name}の服用記録を取り消しました`,
          [{ text: 'OK' }]
        );
      } else {
        // Create a new medication record
        const now = Date.now();
        const medicationRecord: MedicationTakingRecord = {
          id: `med-record-${now}`, // Generate a unique ID
          medicationScheduleId: item.schedule.id,
          scheduledDate: formattedDate,
          consumedAt: now,
        };
        
        // Record the medication consumption
        await recordMedicationConsumption(item.medication.id, medicationRecord);
        
        // Show success message
        Alert.alert(
          '服用記録',
          `${item.medication.name}を服用しました`,
          [{ text: 'OK' }]
        );
      }
      
      // Refresh the medication list
      const allMedications = await getMedications();
      const todayMeds = getTodayMedications(allMedications);
      
      // Recreate the medication items
      const items: MedicationScheduleItem[] = [];
      const dayOfWeek = today.getDay();
      
      for (const medication of todayMeds) {
        const todaySchedules = medication.schedule.filter(
          schedule => schedule.enabled && schedule.days.includes(dayOfWeek)
        );
        
        for (const schedule of todaySchedules) {
          // Check if there's a taking record for this schedule today
          const takingRecord = await getMedicationTakingRecord(
            schedule.id,
            formattedDate
          );
          
          items.push({
            id: `${medication.id}-${schedule.id}`,
            medication,
            schedule,
            hasTakingRecord: !!takingRecord
          });
        }
      }
      
      // Sort by time
      items.sort((a, b) => {
        return a.schedule.time.localeCompare(b.schedule.time);
      });
      
      setMedicationItems(items);
    } catch (error) {
      console.error('Error handling medication record:', error);
      Alert.alert('エラー', '服用記録の処理に失敗しました');
    }
  };

  const renderItem = ({ item }: { item: MedicationScheduleItem }) => {
    // Determine button style and text based on whether a record exists
    const buttonStyle = item.hasTakingRecord
      ? [styles.takeButton, styles.cancelButton]
      : styles.takeButton;
    
    const buttonText = item.hasTakingRecord
      ? "服用を取り消し"
      : "服用する";
    
    const buttonIcon = item.hasTakingRecord
      ? "times-circle"
      : "check-circle";
    
    return (
      <View style={styles.medicationItem}>
        <View style={styles.medicationHeader}>
          <Text style={styles.medicationName}>{item.medication.name}</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: '/edit-medication',
              params: { id: item.medication.id }
            })}
          >
            <FontAwesome name="edit" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {item.medication.description && (
          <Text style={styles.medicationDescription}>{item.medication.description}</Text>
        )}

        <View style={styles.scheduleContainer}>
          <View style={styles.timeContainer}>
            <FontAwesome name="clock-o" size={18} color={theme.tint} style={styles.timeIcon} />
            <Text style={styles.timeText}>{formatTime(item.schedule.time)}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={buttonStyle}
          onPress={() => handleTakeMedication(item)}
        >
          <FontAwesome name={buttonIcon} size={18} color="white" style={styles.takeButtonIcon} />
          <Text style={styles.takeButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>今日の薬</Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </Text>
      </View>

      {medicationItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>今日服用する薬はありません</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-medication')}
          >
            <Text style={styles.addButtonText}>薬を追加</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={medicationItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  medicationItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    // Enhanced shadow for more floating appearance
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    // Add a subtle border
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  actionButton: {
    marginLeft: 16,
  },
  medicationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  scheduleContainer: {
    marginTop: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeIcon: {
    marginRight: 6,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 16,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  takeButton: {
    backgroundColor: '#4CAF50', // Green color for the take medication button
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  takeButtonIcon: {
    marginRight: 8,
  },
  takeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F44336', // Red color for the cancel button
  },
});
