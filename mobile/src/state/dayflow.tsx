import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase, isConfigured } from '../lib/supabase';
import { sampleTasks, validateTask, type Task, type TaskDraft, type FocusSession, type parseBackup } from '../lib/domain';
import { clearReminders, updateTaskReminder } from '../lib/notifications';
import { fetchPages } from '../lib/pagination';

type Backup = ReturnType<typeof parseBackup>;
type Store = {
  tasks: Task[]; sessions: FocusSession[]; session: Session | null; preview: boolean; loading: boolean; busy: boolean; error: string | null; notice: string | null;
  refresh: () => Promise<void>; dismiss: () => void;
  saveTask: (draft: TaskDraft, id?: string) => Promise<void>;
  toggleTask: (task: Task) => Promise<void>; deleteTask: (task: Task) => Promise<void>;
  saveFocus: (session: Omit<FocusSession, 'id'>) => Promise<void>;
  restore: (backup: Backup) => Promise<void>; signOut: () => Promise<void>;
};
const Context = createContext<Store | null>(null);

export function DayFlowProvider({ children }: { children: ReactNode }) {
  const preview = !isConfigured;
  const [tasks, setTasks] = useState<Task[]>(() => preview ? sampleTasks() : []);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!preview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const owner = useRef<string | null>(null);
  const operation = useRef(false);
  const fetchNumber = useRef(0);

  const refresh = useCallback(async () => {
    if (!supabase || !owner.current || operation.current) return;
    const user = owner.current;
    const request = ++fetchNumber.current;
    setLoading(true);
    try {
      function allRows(table: 'tasks' | 'focus_sessions', order: string) {
        return fetchPages((from, to) => supabase!.from(table).select('*').eq('user_id', user).order(order, { ascending: false }).order('id').range(from, to), () => owner.current === user && request === fetchNumber.current);
      }
      const [taskRows, sessionRows] = await Promise.all([allRows('tasks', 'created_at'), allRows('focus_sessions', 'completed_at')]);
      if (owner.current !== user || request !== fetchNumber.current) return;
      setTasks(taskRows as unknown as Task[]); setSessions(sessionRows as unknown as FocusSession[]); setError(null);
    } catch (problem) {
      if (owner.current === user && request === fetchNumber.current) setError(message(problem));
    } finally { if (request === fetchNumber.current) setLoading(false); }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let authEvents = 0;
    function accept(next: Session | null) {
      if (!active) return;
      const nextOwner = next?.user.id || null;
      if (owner.current !== nextOwner) {
        const outgoing = owner.current;
        if (outgoing) void clearReminders(outgoing).catch(() => { if (active) setNotice('Could not cancel the previous account’s reminders. Check your phone notification settings.'); });
        ++fetchNumber.current; setTasks([]); setSessions([]); setError(null); setNotice(null);
      }
      owner.current = nextOwner;
      setSession(next); setLoading(false);
    }
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { ++authEvents; accept(next); });
    supabase.auth.getSession().then(({ data, error }) => { if (active && authEvents === 0) { if (error) setError(message(error)); accept(data.session); } });
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') { supabase?.auth.startAutoRefresh(); void refresh(); }
      else supabase?.auth.stopAutoRefresh();
    });
    return () => { active = false; data.subscription.unsubscribe(); listener.remove(); supabase?.auth.stopAutoRefresh(); };
  }, [refresh]);

  useEffect(() => { if (session?.user.id) void refresh(); }, [session?.user.id, refresh]);

  async function mutate(action: (user: string) => Promise<void>) {
    if (operation.current) throw new Error('Wait for the current change to finish.');
    const user = preview ? 'preview' : owner.current;
    if (!user) throw new Error('Sign in from Settings to save your tasks.');
    operation.current = true; ++fetchNumber.current; setLoading(false); setBusy(true); setError(null); setNotice(null);
    try { await action(user); } catch (problem) { setError(message(problem)); throw new Error(message(problem)); }
    finally { operation.current = false; setBusy(false); }
  }

  function sameAccount(user: string) {
    if (!preview && owner.current !== user) throw new Error('The account changed. Refresh before continuing.');
  }
  async function reminder(task: Task, user: string) {
    const current = () => preview || owner.current === user;
    try { const warning = await updateTaskReminder(task, user, current); if (warning && current()) setNotice(warning); }
    catch { if (current()) setNotice('Task saved, but the phone reminder could not be updated.'); }
  }
  async function saveTask(input: TaskDraft, id?: string) {
    const draft = validateTask(input);
    await mutate(async user => {
      const existing = tasks.find(task => task.id === id);
      let saved: Task;
      if (preview) saved = { ...draft, id: id || `preview-${Date.now()}`, completed: existing?.completed || false };
      else {
        const result = id
          ? await supabase!.from('tasks').update(draft).eq('user_id', user).eq('id', id).select().single()
          : await supabase!.from('tasks').insert({ ...draft, user_id: user }).select().single();
        if (result.error) throw result.error;
        saved = result.data as Task;
      }
      sameAccount(user); setTasks(current => [saved, ...current.filter(task => task.id !== saved.id)]);
      await reminder(saved, user);
    });
  }
  async function toggleTask(task: Task) {
    await mutate(async user => {
      let saved = { ...task, completed: !task.completed };
      if (!preview) {
        const result = await supabase!.from('tasks').update({ completed: saved.completed }).eq('user_id', user).eq('id', task.id).select().single();
        if (result.error) throw result.error;
        saved = result.data as Task;
      }
      sameAccount(user); setTasks(current => current.map(item => item.id === saved.id ? saved : item)); await reminder(saved, user);
    });
  }
  async function deleteTask(task: Task) {
    await mutate(async user => {
      if (!preview) {
        const result = await supabase!.from('tasks').delete().eq('user_id', user).eq('id', task.id).select('id').single();
        if (result.error) throw result.error;
      }
      sameAccount(user); setTasks(current => current.filter(item => item.id !== task.id)); await reminder({ ...task, reminder: false }, user);
    });
  }
  async function saveFocus(input: Omit<FocusSession, 'id'>) {
    await mutate(async user => {
      let saved = { ...input, id: input.client_id };
      if (!preview) {
        const result = await supabase!.from('focus_sessions').upsert({ ...input, user_id: user }, { onConflict: 'user_id,client_id' }).select().single();
        if (result.error) throw result.error;
        saved = result.data as FocusSession;
      }
      sameAccount(user); setSessions(current => [saved, ...current.filter(item => item.client_id !== input.client_id)]);
    });
  }
  async function restore(backup: Backup) {
    await mutate(async user => {
      if (preview) {
        setTasks(current => [...backup.tasks.map((task, index) => ({ ...task, reminder: false, id: `import-${Date.now()}-${index}` })), ...current]);
        setSessions(current => [...backup.sessions.map((item, index) => ({ ...item, id: `import-${Date.now()}-${index}` })), ...current]);
      } else {
        const result = await supabase!.rpc('restore_dayflow', { backup });
        if (result.error) throw result.error;
        sameAccount(user);
      }
      setNotice('Backup imported. Tasks were added as copies; existing tasks were kept. Reminders are off for restored tasks until you edit them.');
    });
    if (!preview) await refresh();
  }
  async function signOut() {
    if (operation.current) throw new Error('Wait for the current change to finish.');
    const user = owner.current;
    if (user) await clearReminders(user);
    const result = await supabase?.auth.signOut({ scope: 'local' });
    if (result?.error) throw result.error;
  }
  return <Context.Provider value={{ tasks, sessions, session, preview, loading, busy, error, notice, refresh, saveTask, toggleTask, deleteTask, saveFocus, restore, signOut, dismiss: () => { setError(null); setNotice(null); } }}>{children}</Context.Provider>;
}
export function message(problem: unknown): string { return problem && typeof problem === 'object' && 'message' in problem ? String(problem.message) : 'Something went wrong. Check your connection and try again.'; }
export function useDayFlow() { const value = useContext(Context); if (!value) throw new Error('DayFlow provider is missing.'); return value; }
