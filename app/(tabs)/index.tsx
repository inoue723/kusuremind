import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Medication } from '@/types';
import { getMedications } from '@/utils/storage';
import { getTodayMedications, formatTime, getDayNames } from '@/utils/notifications';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TodayScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
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
          setMedications(todayMeds);
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

  const renderItem = ({ item }: { item: Medication }) => {
    // Get today's schedules
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todaySchedules = item.schedule.filter(
      schedule => schedule.enabled && schedule.days.includes(dayOfWeek)
    );

    return (
      <View style={styles.medicationItem}>
        <View style={styles.medicationHeader}>
          <Text style={styles.medicationName}>{item.name}</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: '/edit-medication',
              params: { id: item.id }
            })}
          >
            <FontAwesome name="edit" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {item.description && (
          <Text style={styles.medicationDescription}>{item.description}</Text>
        )}

        <View style={styles.scheduleContainer}>
          <Text style={styles.scheduleTitle}>今日の服用時間:</Text>
          {todaySchedules.map((schedule, index) => (
            <View key={index} style={styles.scheduleItem}>
              <Text style={styles.scheduleText}>
                {formatTime(schedule.time)}
              </Text>
            </View>
          ))}
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

      {medications.length === 0 ? (
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
          data={medications}
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
    // Using Themed.View for background color
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  scheduleItem: {
    marginVertical: 4,
  },
  scheduleText: {
    fontSize: 14,
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
