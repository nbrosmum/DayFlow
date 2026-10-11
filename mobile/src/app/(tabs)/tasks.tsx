import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { Page, Header, Status, Field, Chip, Empty, TaskCard, colors, s, type } from '../../components/ui';
import { filterTasks, localDate } from '../../lib/domain';
import { useDayFlow, message } from '../../state/dayflow';
import { useFocus } from '../../state/focus';

export default function Tasks() {
  const { tasks, toggleTask } = useDayFlow();
  const { ready } = useFocus();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('open');
  const visible = filterTasks(tasks, filter, query, null);
  const groups = [...new Set(visible.map(task => task.planned_date || 'Unscheduled'))].sort();
  return <Page refresh><Header eyebrow="A place for everything" title="Clear your mind." subtitle="Capture it here. Make space for the rest." action={<Pressable accessibilityRole="button" disabled={!ready} accessibilityLabel="Add a task" onPress={() => router.push('/task')} style={{ padding: 9, borderRadius: 20, backgroundColor: colors.green }}><Plus size={21} color="white" /></Pressable>} /><Status />
    <View style={{ gap: 16 }}><Field label="Find a task" value={query} onChangeText={setQuery} placeholder="Search titles and notes…" /><View style={[s.row, { gap: 8 }]}><Chip label={`To do · ${tasks.filter(t => !t.completed).length}`} active={filter === 'open'} onPress={() => setFilter('open')} /><Chip label="Completed" active={filter === 'done'} onPress={() => setFilter('done')} /><Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} /></View></View>
    {visible.length ? groups.map(date => <View key={date} style={{ gap: 12 }}><View style={s.between}><Text style={type.eyebrow}>{date === localDate() ? 'TODAY' : date === 'Unscheduled' ? 'WHEN YOU HAVE SPACE' : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</Text><Text style={{ fontSize: 11, color: colors.muted }}>{visible.filter(t => (t.planned_date || 'Unscheduled') === date).length} tasks</Text></View>{visible.filter(task => (task.planned_date || 'Unscheduled') === date).map(task => <TaskCard key={task.id} task={task} onToggle={() => void toggleTask(task).catch(error => Alert.alert('Could not save', message(error)))} />)}</View>) : <Empty title={query ? 'Nothing found' : filter === 'done' ? 'Your wins will live here' : 'A clear slate'} body={query ? 'Try another word or change your filter.' : 'Add a task, then take it one step at a time.'} action={query || filter === 'done' ? undefined : () => router.push('/task')} />}
    <View style={[s.row, { justifyContent: 'center' }]}><Search size={13} color={colors.muted} /><Text style={{ fontSize: 11, color: colors.muted }}>Tap a task to edit its details.</Text></View>
  </Page>;
}
