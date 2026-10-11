import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { localDate, parseBackup, type Task, type FocusSession } from './domain';

export async function exportBackup(tasks: Task[], sessions: FocusSession[]) {
  const json = JSON.stringify({ version: 1, exported_at: new Date().toISOString(), tasks, sessions }, null, 2);
  parseBackup(json);
  const name = `dayflow-${localDate()}.json`;
  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    if (blob.size > 5_000_000) throw new Error('Backup exceeds the 5 MB import limit.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); return;
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is unavailable on this device.');
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true }); file.write(json);
  if (file.size > 5_000_000) throw new Error('Backup exceeds the 5 MB import limit.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Keep a copy of your DayFlow data', UTI: 'public.json' });
}

export async function pickBackup() {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > 5_000_000) throw new Error('Choose a backup smaller than 5 MB.');
  const json = Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
  return parseBackup(json);
}
