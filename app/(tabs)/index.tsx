import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Medication, Schedule } from '@/types';
import { getMedications } from '@/utils/storage';
import { getTodayMedications, formatTime, getDayNames } from '@/utils/notifications';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// Interface for medication-schedule combination
interface MedicationScheduleItem {
  id: string; // Unique ID combining medication ID and schedule ID
  medication: Medication;
  schedule: Schedule;
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
          
          todayMeds.forEach(medication => {
            const todaySchedules = medication.schedule.filter(
              schedule => schedule.enabled && schedule.days.includes(dayOfWeek)
            );
            
            todaySchedules.forEach(schedule => {
              items.push({
                id: `${medication.id}-${schedule.id}`,
                medication,
                schedule
              });
            });
          });
          
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

  const renderItem = ({ item }: { item: MedicationScheduleItem }) => {
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
});
