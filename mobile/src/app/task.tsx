import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Switch, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Save, Trash2, CalendarDays, Bell } from 'lucide-react-native';
import { Page, Card, Field, Chip, Button, colors, s, type } from '../components/ui';
import { useDayFlow, message } from '../state/dayflow';
import { localDate, validateTask, type Priority } from '../lib/domain';

export default function TaskEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const flow = useDayFlow();
  const existing = flow.tasks.find(task => task.id === id);
  const [title, setTitle] = useState(existing?.title || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [date, setDate] = useState(existing?.planned_date || localDate());
  const [time, setTime] = useState(existing?.planned_time || '');
  const [minutes, setMinutes] = useState(existing?.minutes || 25);
  const [priority, setPriority] = useState<Priority>(existing?.priority || 'medium');
  const [reminder, setReminder] = useState(existing?.reminder || false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tomorrow] = useState(() => { const value = new Date(); value.setDate(value.getDate() + 1); return localDate(value); });
  if (id && !existing) return <Page><Text style={type.heading}>This task is no longer available.</Text><Button onPress={() => router.back()}>Go back</Button></Page>;
  async function save() {
    if (saving) return;
    setError(''); setSaving(true);
    try { await flow.saveTask(validateTask({ title, notes, planned_date: date.trim() || null, planned_time: time.trim() || null, minutes, priority, reminder }), id); router.back(); }
    catch (problem) { setError(message(problem)); } finally { setSaving(false); }
  }
  async function remove() {
    if (!existing) return;
    try { await flow.deleteTask(existing); router.back(); } catch (problem) { setError(message(problem)); }
  }
  function confirmDelete() {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this task? This removes it from your task list.')) void remove();
    } else Alert.alert('Delete this task?', 'This removes it from your task list.', [{ text: 'Keep it', style: 'cancel' }, { text: 'Delete task', style: 'destructive', onPress: () => void remove() }]);
  }
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Page><View style={s.between}><Pressable accessibilityLabel="Close task editor" onPress={() => router.back()} style={s.row}><ChevronLeft size={20} color={colors.green} /><Text style={type.label}>Your day</Text></Pressable><Text style={type.eyebrow}>{existing ? 'A LITTLE ADJUSTMENT' : 'MAKE A LITTLE SPACE'}</Text></View><View style={{ gap: 8 }}><Text style={type.title}>{existing ? 'Edit your task.' : 'What’s on your mind?'}</Text><Text style={type.body}>A clear next step is a good place to start.</Text></View>
    <Field label="Task title" placeholder="Something worth making time for…" value={title} onChangeText={setTitle} maxLength={160} autoFocus={!existing} /><Field label="Notes (optional)" placeholder="A little context, a first step…" value={notes} onChangeText={setNotes} multiline maxLength={2000} />
    <Card><View style={s.row}><CalendarDays size={17} color={colors.green} /><Text style={type.heading}>Make a plan</Text></View><View style={{ flexDirection: 'row', gap: 12 }}><View style={{ flex: 1.4 }}><Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-10-11" keyboardType="numbers-and-punctuation" /></View><View style={{ flex: 1 }}><Field label="Time (24 hour)" value={time} onChangeText={setTime} placeholder="09:30" keyboardType="numbers-and-punctuation" /></View></View><View style={[s.row, { flexWrap: 'wrap' }]}><Chip label="Today" active={date === localDate()} onPress={() => setDate(localDate())} /><Chip label="Tomorrow" active={date === tomorrow} onPress={() => setDate(tomorrow)} /><Chip label="Unscheduled" active={!date} onPress={() => { setDate(''); setTime(''); setReminder(false); }} /></View></Card>
    <View style={{ gap: 12 }}><Text style={type.label}>How much time feels right?</Text><View style={[s.row, { flexWrap: 'wrap' }]}>{[15, 25, 30, 45, 60, 90].map(value => <Chip key={value} label={`${value}m`} active={minutes === value} onPress={() => setMinutes(value)} />)}</View></View>
    <View style={{ gap: 12 }}><Text style={type.label}>Priority</Text><View style={s.row}>{(['low', 'medium', 'high'] as Priority[]).map(value => <Chip key={value} label={value === 'low' ? 'Whenever' : value === 'medium' ? 'Worth doing' : 'Important'} active={priority === value} onPress={() => setPriority(value)} />)}</View></View>
    <Card><View style={s.between}><View style={{ flex: 1, gap: 6 }}><View style={s.row}><Bell size={16} color={colors.green} /><Text style={type.label}>A gentle reminder</Text></View><Text style={{ fontSize: 12, color: colors.muted }}>At the planned time, on this phone.</Text></View><Switch accessibilityLabel="Task reminder" value={reminder} onValueChange={setReminder} trackColor={{ true: colors.green, false: '#DDE0D6' }} /></View></Card>
    {error ? <Text accessibilityRole="alert" style={{ fontSize: 13, lineHeight: 20, color: colors.red }}>{error}</Text> : null}<Button loading={saving} disabled={flow.busy} icon={Save} onPress={() => void save()}>{flow.preview ? 'Save to preview' : 'Save task'}</Button>{existing ? <Pressable disabled={flow.busy} onPress={confirmDelete} style={[s.row, { justifyContent: 'center', padding: 10 }]}><Trash2 size={15} color={colors.red} /><Text style={{ fontSize: 13, color: colors.red }}>Delete task</Text></Pressable> : null}
  </Page></KeyboardAvoidingView>;
}
