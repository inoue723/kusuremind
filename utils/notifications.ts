import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Medication, Schedule, NotificationTime } from '@/types';
import { format, parse, isToday, isTomorrow, addDays } from 'date-fns';

// Request permissions for local notifications
export const registerForLocalNotificationsAsync = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get permission for local notifications');
    return false;
  }
  
  console.log('Notification permissions granted');
  return true;
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
  const { hour, minute } = parseTimeString(schedule.time);
  
  // Create a trigger for each day in the schedule
  const identifiers: string[] = [];
  
  for (const day of schedule.days) {
    // Create notification content
    const content: Notifications.NotificationContentInput = {
      title: `お薬の時間です`,
      body: `${medication.name}を服用する時間です`,
      sound: true,
      data: {
        medicationId: medication.id,
        scheduleId: schedule.id,
        medicationName: medication.name,
      },
    };
    
    // Schedule the notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day + 1, // 1-7(Sun-Sat)に変換する
        hour,
        minute,
      },
    });
    
    identifiers.push(identifier);
    console.log(`Scheduled notification for ${medication.name} on day ${day} at ${schedule.time}, ID: ${identifier}`);
  }
  
  // Return the first identifier (we'll use this as a reference)
  return identifiers[0] || `notification-${medication.id}-${schedule.id}`;
};

// Schedule all notifications for a medication
export const scheduleAllNotifications = async (medication: Medication): Promise<void> => {
  // First cancel any existing notifications for this medication
  await cancelMedicationNotifications(medication);
  
  // Then schedule new notifications for each enabled schedule
  const notificationIds: string[] = [];
  
  for (const schedule of medication.schedule) {
    if (schedule.enabled) {
      try {
        const id = await scheduleNotification(medication, schedule);
        notificationIds.push(id);
      } catch (error) {
        console.error(`Failed to schedule notification for ${medication.name}:`, error);
      }
    }
  }
  
  console.log(`Scheduled ${notificationIds.length} notifications for ${medication.name}`);
};

// Cancel all notifications for a medication
export const cancelMedicationNotifications = async (medication: Medication): Promise<void> => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    let cancelCount = 0;
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.medicationId === medication.id) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        cancelCount++;
      }
    }
    
    console.log(`Cancelled ${cancelCount} notifications for ${medication.name}`);
  } catch (error) {
    console.error(`Error cancelling notifications for ${medication.name}:`, error);
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