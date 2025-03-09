import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Link, router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Medication } from '@/types';
import { getMedications, deleteMedication } from '@/utils/storage';
import { formatTime, getDayNames, cancelMedicationNotifications } from '@/utils/notifications';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function MedicationsScreen() {
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
          const data = await getMedications();
          setMedications(data);
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

  const handleDelete = (medication: Medication) => {
    Alert.alert(
      '削除の確認',
      `${medication.name}を削除してもよろしいですか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMedicationNotifications(medication);
              await deleteMedication(medication.id);
              setMedications(medications.filter(med => med.id !== medication.id));
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('エラー', '薬の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Medication }) => (
    <View style={styles.medicationItem}>
      <View style={styles.medicationHeader}>
        <Text style={styles.medicationName}>{item.name}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: '/edit-medication',
              params: { id: item.id }
            })}
          >
            <FontAwesome name="edit" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <FontAwesome name="trash" size={20} color="red" />
          </TouchableOpacity>
        </View>
      </View>

      {item.description && (
        <Text style={styles.medicationDescription}>{item.description}</Text>
      )}

      <View style={styles.scheduleContainer}>
        <Text style={styles.scheduleTitle}>スケジュール:</Text>
        {item.schedule.map((schedule, index) => (
          <View key={index} style={styles.scheduleItem}>
            <Text style={styles.scheduleText}>
              {formatTime(schedule.time)} - {getDayNames(schedule.days)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {medications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>薬が登録されていません</Text>
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
  actionButtons: {
    flexDirection: 'row',
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