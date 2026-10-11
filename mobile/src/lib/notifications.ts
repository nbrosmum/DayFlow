import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Task } from './domain';

async function notifications() {
  if (Platform.OS === 'web') return null;
  return import('expo-notifications');
}

export async function notificationPermission(): Promise<boolean> {
  const api = await notifications();
  if (!api) return false;
  api.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
  if (Platform.OS === 'android') await api.setNotificationChannelAsync('dayflow', { name: 'DayFlow reminders', importance: api.AndroidImportance.DEFAULT });
  const existing = await api.getPermissionsAsync();
  if (existing.granted) return true;
  return (await api.requestPermissionsAsync()).granted;
}

export async function updateTaskReminder(task: Task, owner: string, current: () => boolean = () => true): Promise<string | null> {
  const api = await notifications();
  const key = `dayflow.reminder.${owner}.${task.id}`;
  const previous = await AsyncStorage.getItem(key);
  if (previous && api) await api.cancelScheduledNotificationAsync(previous);
  await AsyncStorage.removeItem(key);
  if (!task.reminder || task.completed || !task.planned_date || !task.planned_time) return null;
  if (!api) return 'Task saved. Phone reminders are available in the Android or iOS app.';
  const date = new Date(`${task.planned_date}T${task.planned_time}:00`);
  if (date.getTime() <= Date.now()) return 'Task saved. Choose a future time to receive a reminder.';
  if (!await notificationPermission()) return 'Task saved. Notifications are disabled; enable them in your phone settings.';
  if (!current()) return null;
  const id = await api.scheduleNotificationAsync({ content: { title: 'A little nudge from DayFlow', body: task.title, sound: 'default' }, trigger: { type: api.SchedulableTriggerInputTypes.DATE, date, channelId: 'dayflow' } });
  await AsyncStorage.setItem(key, id);
  if (!current()) { await api.cancelScheduledNotificationAsync(id); await AsyncStorage.removeItem(key); }
  return null;
}

export async function clearReminders(owner: string) {
  const api = await notifications();
  const keys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(`dayflow.reminder.${owner}.`));
  for (const key of keys) {
    const id = await AsyncStorage.getItem(key);
    if (api && id) await api.cancelScheduledNotificationAsync(id);
  }
  if (keys.length) await AsyncStorage.multiRemove(keys);
}

export async function scheduleFocusReminder(seconds: number): Promise<string | null> {
  const api = await notifications();
  if (!api || !await notificationPermission()) return null;
  return api.scheduleNotificationAsync({ content: { title: 'You made time for what matters.', body: 'Your focus session is complete. Take a little break.', sound: 'default' }, trigger: { type: api.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, seconds), repeats: false, channelId: 'dayflow' } });
}

export async function cancelFocusReminder(id: string | null) {
  const api = await notifications();
  if (api && id) await api.cancelScheduledNotificationAsync(id);
}
