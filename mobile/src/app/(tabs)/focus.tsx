import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Play, Pause, RotateCcw, Check, Coffee, Leaf, Clock3 } from 'lucide-react-native';
import { Page, Header, Status, Card, Chip, Button, Section, colors, s, type } from '../../components/ui';
import { useFocus } from '../../state/focus';
import { useDayFlow } from '../../state/dayflow';
import { localDate } from '../../lib/domain';

export default function Focus() {
  const flow = useDayFlow();
  const focus = useFocus();
  const [minutes, setMinutes] = useState(25);
  const [selected, setSelected] = useState<string | null>(null);
  const { timer, seconds, working } = focus;
  const total = flow.sessions.filter(item => localDate(new Date(item.completed_at)) === localDate()).reduce((sum, item) => sum + Number(item.minutes), 0);
  const display = timer ? seconds : minutes * 60;
  const time = `${String(Math.floor(display / 60)).padStart(2, '0')}:${String(display % 60).padStart(2, '0')}`;
  const ratio = timer ? Math.max(0, 1 - seconds / timer.duration) : 0;
  return <Page><Header eyebrow="Less noise. More presence." title="One thing at a time." subtitle="You don’t need to do it all. Just be here." /><Status />
    <Card style={{ alignItems: 'center', paddingVertical: 30, gap: 22 }}><View style={s.row}>{timer?.phase === 'finished' ? <Coffee size={16} color={colors.coral} /> : <Leaf size={16} color={colors.green} />}<Text style={[type.eyebrow, { color: colors.green }]}>{timer?.phase === 'finished' ? 'TIME FOR A BREATHER' : timer?.phase === 'paused' ? 'TAKE YOUR TIME' : 'PROTECT THIS MOMENT'}</Text></View>
      <View style={{ width: 230, height: 230, borderRadius: 115, borderWidth: 7, borderColor: timer?.phase === 'finished' ? colors.green : '#E5EBDf', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8F1', gap: 6 }}><Text accessibilityRole="timer" style={{ fontSize: 55, color: colors.text, letterSpacing: -2, fontWeight: '300', fontVariant: ['tabular-nums'] }}>{timer?.phase === 'finished' ? 'Well done.' : time}</Text><Text style={{ fontSize: 12, color: colors.muted }}>{timer?.phase === 'finished' ? `${Math.round((timer.duration - timer.remaining) / 60)} minutes of presence` : timer?.phase === 'running' ? 'Let the rest wait.' : timer?.phase === 'paused' ? 'Paused. Come back when ready.' : 'Minutes just for you.'}</Text></View>
      {timer ? <View style={{ width: '100%', gap: 8 }}><Text style={[type.label, { textAlign: 'center' }]} numberOfLines={2}>{timer.taskTitle}</Text><View style={{ height: 4, backgroundColor: colors.greenLight, borderRadius: 2 }}><View style={{ width: `${ratio * 100}%`, height: 4, backgroundColor: colors.green, borderRadius: 2 }} /></View></View> : <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'center' }]}>{[15, 25, 45, 60].map(value => <Chip key={value} disabled={!focus.ready} label={`${value} min`} active={minutes === value} onPress={() => setMinutes(value)} />)}</View>}
      {!timer ? <View style={{ width: '100%' }}><Button icon={Play} loading={working} disabled={!focus.ready} onPress={() => void focus.start(minutes, flow.tasks.find(task => task.id === selected))}>Begin focus</Button></View> : timer.phase === 'finished' ? <View style={{ width: '100%', gap: 10 }}><Button icon={Check} loading={working} onPress={() => void focus.save()}>Save session</Button><Button secondary onPress={() => void focus.reset()}>Discard session</Button></View> : <View style={{ width: '100%', gap: 12 }}><Button icon={timer.phase === 'running' ? Pause : Play} loading={working} onPress={() => void (timer.phase === 'running' ? focus.pause() : focus.resume())}>{timer.phase === 'running' ? 'Pause for a moment' : 'Continue focus'}</Button><View style={s.between}><Pressable disabled={working} onPress={() => void focus.reset()} style={s.row}><RotateCcw size={14} color={colors.muted} /><Text style={{ fontSize: 12, color: colors.muted }}>Reset</Text></Pressable><Pressable disabled={working} onPress={() => void focus.finish()}><Text style={{ fontSize: 12, color: colors.green }}>Finish early</Text></Pressable></View></View>}
      {focus.timerError ? <Text style={{ fontSize: 12, lineHeight: 18, color: colors.red, textAlign: 'center' }}>{focus.timerError}</Text> : null}
    </Card>
    {!timer ? <View style={{ gap: 12 }}><Section title="What deserves your attention?" /><Pressable style={[s.card, { padding: 15, borderColor: selected === null ? colors.green : colors.border }]} onPress={() => setSelected(null)}><Text style={type.label}>Just some quiet focus</Text></Pressable>{flow.tasks.filter(task => !task.completed).map(task => <Pressable key={task.id} onPress={() => setSelected(task.id)} style={[s.card, { padding: 15, borderColor: selected === task.id ? colors.green : colors.border }]}><View style={s.between}><Text style={[type.label, { flex: 1 }]}>{task.title}</Text>{selected === task.id ? <Check size={16} color={colors.green} /> : <Text style={{ fontSize: 11, color: colors.muted }}>{task.minutes}m</Text>}</View></Pressable>)}</View> : null}
    <View style={{ gap: 12 }}><Section title="Time well spent" label={`${Math.round(total)} min today`} />{flow.sessions.length ? flow.sessions.slice(0, 5).map(item => <View key={item.id} style={s.between}><View style={[s.row, { flex: 1 }]}><Clock3 size={16} color={colors.green} /><View style={{ flex: 1 }}><Text style={type.label}>{item.task_title}</Text><Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>{new Date(item.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text></View></View><Text style={{ fontSize: 13, color: colors.green }}>{item.minutes} min</Text></View>) : <Text style={type.body}>Your finished sessions will appear here. Every minute counts.</Text>}</View>
  </Page>;
}
