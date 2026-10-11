export type Priority = 'low' | 'medium' | 'high';
export type TaskDraft = { title: string; notes: string; planned_date: string | null; planned_time: string | null; minutes: number; priority: Priority; reminder: boolean };
export type Task = TaskDraft & { id: string; completed: boolean; created_at?: string };
export type FocusSession = { id: string; client_id: string; task_title: string; minutes: number; completed_at: string };
export type Timer = { id: string; phase: 'running' | 'paused' | 'finished'; endsAt: number | null; remaining: number; duration: number; taskTitle: string; taskId: string | null; completedAt?: string };

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validateTask(input: unknown): TaskDraft {
  if (!input || typeof input !== 'object') throw new Error('Task is invalid.');
  const value = input as Record<string, unknown>;
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  if (!title || title.length > 160) throw new Error('Use a title between 1 and 160 characters.');
  const notes = typeof value.notes === 'string' ? value.notes.trim() : '';
  if (notes.length > 2000) throw new Error('Notes must be under 2000 characters.');
  const date = value.planned_date || null;
  if (date !== null) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Use a date like 2026-10-11.');
    const parsed = new Date(`${date}T12:00:00`);
    if (!Number.isFinite(parsed.getTime()) || localDate(parsed) !== date) throw new Error('Enter a real calendar date.');
  }
  const time = value.planned_time || null;
  if (time !== null && (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !date)) throw new Error('Use a time like 09:30 and choose a date.');
  const minutes = Number(value.minutes);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 480) throw new Error('Estimated minutes must be between 1 and 480.');
  if (!['low', 'medium', 'high'].includes(String(value.priority))) throw new Error('Choose a valid priority.');
  const reminder = value.reminder === true;
  if (reminder && (!date || !time)) throw new Error('Choose a date and time for the reminder.');
  return { title, notes, planned_date: date as string | null, planned_time: time as string | null, minutes, priority: value.priority as Priority, reminder };
}

export function filterTasks(tasks: Task[], status: string, query: string, date: string | null): Task[] {
  const search = query.trim().toLowerCase();
  return tasks.filter(task => (!date || task.planned_date === date)
    && (status === 'all' || (status === 'done' ? task.completed : !task.completed))
    && `${task.title} ${task.notes}`.toLowerCase().includes(search))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || (a.planned_time || '99:99').localeCompare(b.planned_time || '99:99'));
}

export function remainingSeconds(timer: Pick<Timer, 'phase' | 'endsAt' | 'remaining'>, now: number): number {
  return Math.max(0, timer.phase === 'running' && timer.endsAt !== null ? Math.ceil((timer.endsAt - now) / 1000) : timer.remaining);
}

export function parseBackup(json: string): { version: 1; tasks: (TaskDraft & { completed: boolean })[]; sessions: Omit<FocusSession, 'id'>[] } {
  let value;
  try { value = JSON.parse(json); } catch { throw new Error('This file is not valid JSON.'); }
  if (!value || value.version !== 1 || !Array.isArray(value.tasks) || !Array.isArray(value.sessions)) throw new Error('Use a DayFlow version 1 backup.');
  if (value.tasks.length > 10000 || value.sessions.length > 10000) throw new Error('Import at most 10000 tasks and 10000 sessions at a time.');
  return { version: 1, tasks: value.tasks.map((task: Record<string, unknown>) => {
    if (typeof task.completed !== 'boolean') throw new Error('Task completion is invalid.');
    return { ...validateTask(task), completed: task.completed };
  }), sessions: value.sessions.map((session: Record<string, unknown>) => {
    if (typeof session.task_title !== 'string' || session.task_title.length > 160 || typeof session.client_id !== 'string' || session.client_id.length > 100 || !Number.isFinite(Number(session.minutes)) || Number(session.minutes) < 0 || Number(session.minutes) > 480 || typeof session.completed_at !== 'string' || !Number.isFinite(Date.parse(session.completed_at))) throw new Error('A focus session is invalid.');
    return { client_id: session.client_id, task_title: session.task_title, minutes: Number(session.minutes), completed_at: session.completed_at };
  }) };
}

export function sampleTasks(): Task[] {
  const today = localDate();
  return [
    { id: 'sample-1', title: 'A little room to breathe', notes: 'Stretch, get some water, ease into the day.', planned_date: today, planned_time: '08:00', minutes: 15, priority: 'low', reminder: false, completed: true },
    { id: 'sample-2', title: 'Learn something new', notes: 'One chapter. One small step forward.', planned_date: today, planned_time: '09:30', minutes: 25, priority: 'high', reminder: false, completed: false },
    { id: 'sample-3', title: 'Make time for a walk', notes: 'Leave the screen behind for a while.', planned_date: today, planned_time: '12:30', minutes: 30, priority: 'low', reminder: false, completed: false },
    { id: 'sample-4', title: 'Plan tomorrow, gently', notes: 'Choose the three things that matter.', planned_date: today, planned_time: '17:00', minutes: 15, priority: 'medium', reminder: false, completed: false },
  ];
}
