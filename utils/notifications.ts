import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Medication, Schedule, NotificationTime } from '@/types';
import { format, parse, isToday, isTomorrow, addDays } from 'date-fns';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions
export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Constants.platform?.ios) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
  }
};

// Parse time string to get hours and minutes
export const parseTimeString = (timeString: string): NotificationTime => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hour: hours, minute: minutes };
};

// Schedule a notification for a medication
export const scheduleNotification = async (
  medication: Medication,
  schedule: Schedule
): Promise<string> => {
  // For now, we'll just return a placeholder identifier
  // In a real app, we would properly schedule notifications
  console.log(`Would schedule notification for ${medication.name} at ${schedule.time}`);
  return `notification-${medication.id}-${schedule.id}`;
};

// Schedule all notifications for a medication
export const scheduleAllNotifications = async (medication: Medication): Promise<void> => {
  for (const schedule of medication.schedule) {
    if (schedule.enabled) {
      await scheduleNotification(medication, schedule);
    }
  }
};

// Cancel all notifications for a medication
export const cancelMedicationNotifications = async (medication: Medication): Promise<void> => {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.medicationId === medication.id) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

// Get today's medications
export const getTodayMedications = (medications: Medication[]): Medication[] => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0-6 (Sunday-Saturday)
  
  return medications.filter(medication => 
    medication.schedule.some(schedule => 
      schedule.enabled && schedule.days.includes(dayOfWeek)
    )
  );
};

// Format time for display
export const formatTime = (timeString: string): string => {
  const date = parse(timeString, 'HH:mm', new Date());
  return format(date, 'h:mm a');
};

// Get day names for display
export const getDayNames = (days: number[]): string => {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  if (days.length === 7) return '毎日';
  
  return days.map(day => dayNames[day]).join(', ');
};