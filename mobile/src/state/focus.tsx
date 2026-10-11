import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { remainingSeconds, type Task, type Timer } from '../lib/domain';
import { cancelFocusReminder, scheduleFocusReminder } from '../lib/notifications';
import { useDayFlow } from './dayflow';

type SavedTimer = Timer & { notificationId?: string | null };
type FocusStore = { timer: SavedTimer | null; seconds: number; ready: boolean; working: boolean; timerError: string | null; start: (minutes: number, task?: Task) => Promise<void>; pause: () => Promise<void>; resume: () => Promise<void>; reset: () => Promise<void>; finish: () => Promise<void>; save: () => Promise<void> };
const Context = createContext<FocusStore | null>(null);

export function FocusProvider({ children }: { children: ReactNode }) {
  const { session, preview, saveFocus } = useDayFlow();
  const account = session?.user.id || (preview ? 'preview' : 'guest');
  const key = `dayflow.timer.${account}`;
  const [timer, setTimer] = useState<SavedTimer | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [loaded, setLoaded] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [timerError, setTimerError] = useState<string | null>(null);
  const lock = useRef(false);
  const accountRef = useRef(account);
  const ready = loaded === key;

  useEffect(() => {
    let active = true;
    accountRef.current = account;
    AsyncStorage.getItem(key).then(raw => {
      if (!active) return;
      let next: SavedTimer | null = null;
      try {
        const value = raw ? JSON.parse(raw) : null;
        if (value && ['running', 'paused', 'finished'].includes(value.phase) && typeof value.id === 'string' && Number.isFinite(value.duration) && value.duration > 0 && value.duration <= 28800 && Number.isFinite(value.remaining) && value.remaining >= 0 && (value.phase !== 'running' || Number.isFinite(value.endsAt))) {
          next = value;
          if (next && next.phase === 'running' && remainingSeconds(next, Date.now()) === 0) next = { ...next, phase: 'finished', remaining: 0, completedAt: new Date(next.endsAt!).toISOString() };
        }
      } catch { /* Ignore invalid recovery metadata. */ }
      setTimer(next); setLoaded(key); setNow(Date.now()); setTimerError(null);
    }).catch(() => { if (active) { setTimer(null); setLoaded(key); setTimerError('Timer recovery is unavailable on this device.'); } });
    return () => { active = false; };
  }, [key, account]);

  useEffect(() => {
    if (!ready) return;
    const persist = timer ? AsyncStorage.setItem(key, JSON.stringify(timer)) : AsyncStorage.removeItem(key);
    persist.catch(() => setTimerError('Timer is running, but could not be saved for recovery.'));
  }, [timer, key, ready]);

  useEffect(() => {
    const tick = () => {
      const time = Date.now(); setNow(time);
      setTimer(current => current?.phase === 'running' && remainingSeconds(current, time) === 0 ? { ...current, phase: 'finished', remaining: 0, completedAt: new Date(current.endsAt!).toISOString() } : current);
    };
    const interval = setInterval(tick, 1000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') tick(); });
    return () => { clearInterval(interval); listener.remove(); };
  }, []);

  async function act(action: () => Promise<void>) {
    if (!ready || lock.current) return;
    lock.current = true; setWorking(true); setTimerError(null);
    const scope = account;
    try { await action(); } catch { if (accountRef.current === scope) setTimerError('Could not update the timer. Please try again.'); }
    finally { lock.current = false; setWorking(false); }
  }
  async function start(minutes: number, task?: Task) {
    await act(async () => {
      await cancelFocusReminder(timer?.notificationId || null);
      const scope = account;
      const duration = minutes * 60;
      let notificationId: string | null = null;
      try { notificationId = await scheduleFocusReminder(duration); } catch { if (accountRef.current === scope) setTimerError('Timer works, but its notification could not be scheduled.'); }
      if (accountRef.current !== scope) { await cancelFocusReminder(notificationId); return; }
      const time = Date.now();
      setTimer({ id: `${time}-${Math.random().toString(36).slice(2, 8)}`, phase: 'running', endsAt: time + duration * 1000, remaining: duration, duration, taskTitle: task?.title || 'A little focused time', taskId: task?.id || null, notificationId }); setNow(time);
    });
  }
  async function pause() {
    await act(async () => { if (!timer || timer.phase !== 'running') return; const seconds = remainingSeconds(timer, Date.now()); await cancelFocusReminder(timer.notificationId || null); if (accountRef.current === account) setTimer(current => current?.id === timer.id ? { ...timer, phase: seconds ? 'paused' : 'finished', endsAt: null, remaining: seconds, notificationId: null } : current); });
  }
  async function resume() {
    await act(async () => {
      if (!timer || timer.phase !== 'paused') return;
      let notificationId: string | null = null;
      try { notificationId = await scheduleFocusReminder(timer.remaining); } catch { if (accountRef.current === account) setTimerError('Timer works, but its notification could not be scheduled.'); }
      if (accountRef.current !== account) { await cancelFocusReminder(notificationId); return; }
      setTimer(current => current?.id === timer.id ? { ...timer, phase: 'running', endsAt: Date.now() + timer.remaining * 1000, notificationId } : current); setNow(Date.now());
    });
  }
  async function reset() { await act(async () => { await cancelFocusReminder(timer?.notificationId || null); if (accountRef.current === account) setTimer(current => current?.id === timer?.id ? null : current); }); }
  async function finish() { await act(async () => { if (!timer) return; const remaining = remainingSeconds(timer, Date.now()); await cancelFocusReminder(timer.notificationId || null); if (accountRef.current === account) setTimer(current => current?.id === timer.id ? { ...timer, phase: 'finished', remaining, endsAt: null, notificationId: null, completedAt: new Date().toISOString() } : current); }); }
  async function save() {
    if (!timer || timer.phase !== 'finished' || lock.current) return;
    lock.current = true; setWorking(true); setTimerError(null);
    try {
      await saveFocus({ client_id: timer.id, task_title: timer.taskTitle, minutes: Math.round((timer.duration - timer.remaining) / 60 * 10) / 10, completed_at: timer.completedAt || new Date().toISOString() });
      await cancelFocusReminder(timer.notificationId || null); if (accountRef.current === account) setTimer(current => current?.id === timer.id ? null : current);
    } catch { if (accountRef.current === account) setTimerError('Session not saved. Check your connection or sign in, then try again. Your session stays here for retry.'); }
    finally { lock.current = false; setWorking(false); }
  }
  const visible = ready ? timer : null;
  return <Context.Provider value={{ timer: visible, seconds: visible ? remainingSeconds(visible, now) : 25 * 60, ready, working, timerError, start, pause, resume, reset, finish, save }}>{children}</Context.Provider>;
}
export function useFocus() { const value = useContext(Context); if (!value) throw new Error('Focus provider missing.'); return value; }
