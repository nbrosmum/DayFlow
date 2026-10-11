import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, Text, View } from 'react-native';
import { Bell, Check, ChevronRight, Cloud, Download, ExternalLink, LogOut, Mail, RefreshCw, ShieldCheck, Upload, UserRound } from 'lucide-react-native';
import { Page, Header, Status, Card, Field, Chip, Button, colors, s, type } from '../../components/ui';
import { useDayFlow, message } from '../../state/dayflow';
import { useFocus } from '../../state/focus';
import { supabase } from '../../lib/supabase';
import { exportBackup, pickBackup } from '../../lib/backup';
import { notificationPermission } from '../../lib/notifications';

export default function Settings() {
  const flow = useDayFlow();
  const focus = useFocus();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [failure, setFailure] = useState(false);
  async function perform(action: () => Promise<string | void>) {
    if (working) return;
    setWorking(true); setFeedback(''); setFailure(false);
    try { const text = await action(); if (text) setFeedback(text); }
    catch (problem) { setFailure(true); setFeedback(message(problem)); }
    finally { setWorking(false); }
  }
  async function authenticate() {
    if (!supabase) throw new Error('Connect a Supabase project first using the mobile setup guide.');
    if (!email.trim() || !password) throw new Error('Enter your email and password.');
    if (mode === 'signup' && password.length < 8) throw new Error('Use a password with at least 8 characters.');
    const result = mode === 'signin' ? await supabase.auth.signInWithPassword({ email: email.trim(), password }) : await supabase.auth.signUp({ email: email.trim(), password });
    if (result.error) throw result.error;
    setPassword('');
    return result.data.session ? 'Welcome to your personal space.' : 'Check your email to confirm your account, then sign in here.';
  }
  async function signOut() {
    await focus.reset(); await flow.signOut(); setPassword(''); return 'You’re signed out on this device.';
  }
  async function importData() {
    const backup = await pickBackup();
    if (!backup) return;
    const approved = Platform.OS === 'web'
      ? window.confirm(`Add ${backup.tasks.length} tasks and import ${backup.sessions.length} focus sessions? Tasks are added as copies. Existing data is kept.`)
      : await new Promise<boolean>(resolve => Alert.alert('Restore your backup?', `Add ${backup.tasks.length} tasks and import ${backup.sessions.length} sessions. Tasks are added as copies. Existing data is kept.`, [{ text: 'Cancel', style: 'cancel', onPress: () => resolve(false) }, { text: 'Import', onPress: () => resolve(true) }], { cancelable: true, onDismiss: () => resolve(false) }));
    if (approved) { await flow.restore(backup); return 'Your backup has been imported.'; }
  }
  return <Page><Header eyebrow="Your space, your pace" title="Make yourself at home." subtitle="A few thoughtful settings. Nothing more." /><Status />
    <Card><View style={s.row}><View style={{ backgroundColor: colors.greenLight, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}><UserRound size={21} color={colors.green} /></View><View style={{ flex: 1, gap: 4 }}><Text style={type.heading}>{flow.session ? 'Your personal space' : flow.preview ? 'Take a look around' : 'Welcome to DayFlow'}</Text><Text style={{ fontSize: 12, color: colors.muted }}>{flow.session?.user.email || (flow.preview ? 'An in-memory preview, just for exploring.' : 'Sign in to save your progress.')}</Text></View></View>
      {flow.preview ? <><Text style={type.body}>You can try tasks and the focus timer here. Preview changes reset when you restart. Connect Supabase to keep your data and use it across devices.</Text><Pressable style={s.row} onPress={() => void Linking.openURL('https://supabase.com/dashboard')}><Text style={{ color: colors.green, fontSize: 13, fontWeight: '600' }}>Open Supabase dashboard</Text><ExternalLink size={14} color={colors.green} /></Pressable><Text style={{ fontSize: 12, color: colors.muted, lineHeight: 20 }}>The connection steps are in mobile/README.md. Your project URL and publishable key belong in mobile/.env.</Text></> : flow.session ? <><View style={s.row}><ShieldCheck size={15} color={colors.green} /><Text style={{ color: colors.green, fontSize: 12 }}>Connected to your Supabase account</Text></View><Button secondary icon={LogOut} disabled={flow.busy || focus.working} loading={working} onPress={() => void perform(signOut)}>Sign out on this device</Button></> : <><View style={s.row}><Chip label="Sign in" active={mode === 'signin'} onPress={() => setMode('signin')} /><Chip label="Create account" active={mode === 'signup'} onPress={() => setMode('signup')} /></View><Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} /><Button icon={Mail} loading={working} onPress={() => void perform(authenticate)}>{mode === 'signin' ? 'Sign in' : 'Create your space'}</Button></>}
    </Card>
    {feedback ? <Text accessibilityRole="alert" style={{ fontSize: 13, lineHeight: 20, color: failure ? colors.red : colors.green }}>{feedback}</Text> : null}
    <Card><Text style={type.heading}>Keep things in sync</Text><Text style={type.body}>{flow.preview ? 'Preview data stays in memory. A cloud account will keep your tasks safe across restarts.' : 'Tasks live in Supabase. An internet connection is needed to load or save changes.'}</Text><Button secondary icon={RefreshCw} disabled={flow.preview || !flow.session || flow.busy} loading={flow.loading} onPress={() => void flow.refresh()}>Refresh cloud data</Button></Card>
    <Card><Text style={type.heading}>A copy, just in case</Text><Text style={type.body}>Export your tasks and focus history as a JSON file. Keep it somewhere you trust.</Text><Button secondary icon={Download} disabled={flow.busy || (!flow.preview && !flow.session)} loading={working} onPress={() => void perform(async () => { await exportBackup(flow.tasks, flow.sessions); return 'Backup exported.'; })}>Export backup</Button><Button secondary icon={Upload} disabled={flow.busy || (!flow.preview && !flow.session)} onPress={() => void perform(importData)}>Import backup</Button><Text style={{ fontSize: 11, lineHeight: 18, color: colors.muted }}>Imports add copies of tasks. Reminders need to be enabled again on this phone.</Text></Card>
    <Card><View style={s.between}><View style={s.row}><Bell size={18} color={colors.green} /><Text style={type.heading}>Gentle nudges</Text></View><Check size={16} color={colors.green} /></View><Text style={type.body}>Reminders are scheduled on this device. You choose whether to receive them.</Text><Button secondary icon={Bell} loading={working} onPress={() => void perform(async () => Platform.OS === 'web' ? 'Phone notifications are available in the Android or iOS app.' : await notificationPermission() ? 'Notifications are enabled. Add a reminder when you edit a task.' : 'Notifications are disabled. You can enable them in your phone settings.')}>Check notification permission</Button></Card>
    <View style={{ gap: 12 }}><View style={s.between}><View style={s.row}><Cloud size={15} color={colors.muted} /><Text style={{ fontSize: 12, color: colors.muted }}>Supabase is your only task database.</Text></View><ChevronRight size={14} color={colors.muted} /></View><Text style={{ fontSize: 11, lineHeight: 18, color: colors.muted }}>DayFlow · 1.0.0 · Open source, MIT licensed{`\n`}Built for a calmer relationship with time.</Text></View>
  </Page>;
}
