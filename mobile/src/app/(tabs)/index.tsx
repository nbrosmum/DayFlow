import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpRight, Check, Clock3, Plus, Sparkles, Target } from 'lucide-react-native';
import { Page, Header, Status, Card, Section, TaskCard, Empty, colors, s, type } from '../../components/ui';
import { useDayFlow, message } from '../../state/dayflow';
import { localDate, filterTasks } from '../../lib/domain';
import { useFocus } from '../../state/focus';

export default function Today() {
  const { tasks, sessions, toggleTask } = useDayFlow();
  const { ready } = useFocus();
  const [now] = useState(() => new Date());
  const today = localDate();
  const planned = filterTasks(tasks, 'all', '', today);
  const completed = planned.filter(task => task.completed).length;
  const minutes = planned.filter(task => !task.completed).reduce((sum, task) => sum + task.minutes, 0);
  const focusMinutes = sessions.filter(session => localDate(new Date(session.completed_at)) === today).reduce((sum, session) => sum + Number(session.minutes), 0);
  const next = planned.find(task => !task.completed);
  const greeting = now.getHours() < 12 ? 'A fresh start.' : now.getHours() < 18 ? 'Room to make progress.' : 'A gentle finish.';
  return <Page refresh><Header eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} title={greeting} subtitle="A little structure. A little breathing room." action={<Pressable accessibilityRole="button" disabled={!ready} accessibilityLabel="Add a task" onPress={() => router.push('/task')} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}><Plus size={21} color="white" /></Pressable>} /><Status />
    <Card style={{ backgroundColor: colors.greenLight, borderColor: '#DEE7D5', gap: 18 }}><View style={s.between}><View style={{ gap: 5 }}><Text style={[type.eyebrow, { color: colors.green }]}>YOUR DAY, AT A GLANCE</Text><Text style={[type.heading, { fontSize: 23 }]}>{planned.length ? `${completed} of ${planned.length} little wins` : 'A day full of possibility'}</Text></View><View style={{ borderRadius: 22, width: 44, height: 44, backgroundColor: '#DAE5D1', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={21} color={colors.green} /></View></View><View style={{ height: 6, backgroundColor: '#D8E2CF', borderRadius: 3 }}><View style={{ height: 6, backgroundColor: colors.green, borderRadius: 3, width: `${planned.length ? completed / planned.length * 100 : 0}%` }} /></View><Text style={{ fontSize: 12, color: colors.green }}>{planned.length && completed === planned.length ? 'Everything you planned is done. Enjoy the space.' : 'Progress counts, even when it comes in small steps.'}</Text></Card>
    <View style={{ flexDirection: 'row', gap: 12 }}><Stat icon={<Check size={17} color={colors.green} />} value={String(completed)} label="Tasks complete" /><Stat icon={<Clock3 size={17} color={colors.coral} />} value={`${Math.round(focusMinutes)}m`} label="Focused today" /><Stat icon={<Target size={17} color="#7B94AE" />} value={`${minutes}m`} label="Still planned" /></View>
    <View style={{ gap: 14 }}><Section title="Your timeline" label={`${planned.filter(task => !task.completed).length} remaining`} />{planned.length ? planned.map(task => <View key={task.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><View style={{ width: 40, alignItems: 'center', gap: 8 }}><Text style={{ fontSize: 10, color: colors.muted }}>{task.planned_time || 'Anytime'}</Text><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: task.completed ? colors.green : colors.coral }} /></View><View style={{ flex: 1 }}><TaskCard task={task} onToggle={() => void toggleTask(task).catch(error => Alert.alert('Could not save', message(error)))} /></View></View>) : <Empty title="Make room for what matters" body="Choose one small thing to start with today." action={() => router.push('/task')} />}</View>
    {next ? <Pressable onPress={() => router.push('/focus')}><Card style={{ backgroundColor: colors.coralLight, borderColor: '#F3DDD2' }}><View style={s.between}><Text style={[type.eyebrow, { color: colors.coral }]}>ONE THING AT A TIME</Text><ArrowUpRight size={19} color={colors.coral} /></View><Text style={type.heading}>{next.title}</Text><Text style={type.body}>Give it your attention. A 25-minute focus session is a good place to start.</Text></Card></Pressable> : null}
    <View style={{ alignItems: 'center', gap: 7, paddingTop: 6 }}><View style={{ width: 24, height: 1, backgroundColor: '#C9CBBE' }} /><Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.muted }}>A good day doesn’t have to be a busy day.</Text></View>
  </Page>;
}
function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <Card style={{ flex: 1, padding: 13, gap: 9 }}>{icon}<Text style={{ fontSize: 24, fontWeight: '600', color: colors.text, letterSpacing: -0.5 }}>{value}</Text><Text style={{ fontSize: 10, color: colors.muted }}>{label}</Text></Card>; }
