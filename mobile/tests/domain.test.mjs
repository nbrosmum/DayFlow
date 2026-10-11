import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTask, filterTasks, remainingSeconds, parseBackup } from '../src/lib/domain.ts';
import { fetchPages } from '../src/lib/pagination.ts';

const input = { title: '  Read a chapter  ', notes: '', planned_date: '2026-10-11', planned_time: '09:30', minutes: 25, priority: 'medium', reminder: false };

test('task input trims titles and rejects invalid calendar dates and durations', () => {
  assert.equal(validateTask(input).title, 'Read a chapter');
  assert.throws(() => validateTask({ ...input, title: '   ' }), /title/i);
  assert.throws(() => validateTask({ ...input, planned_date: '2026-02-30' }), /date/i);
  assert.throws(() => validateTask({ ...input, planned_time: '24:00' }), /time/i);
  assert.throws(() => validateTask({ ...input, minutes: -1 }), /minutes/i);
  assert.throws(() => validateTask({ ...input, reminder: true, planned_time: null }), /time/i);
});

test('task search and completion filters do not mix tomorrow into today', () => {
  const tasks = [
    { ...input, id: 'a', title: 'Read a chapter', completed: false },
    { ...input, id: 'b', title: 'Write notes', completed: true },
    { ...input, id: 'c', title: 'Read tomorrow', completed: false, planned_date: '2026-10-12' },
  ];
  assert.deepEqual(filterTasks(tasks, 'open', 'READ', '2026-10-11').map(t => t.id), ['a']);
  assert.deepEqual(filterTasks(tasks, 'done', '', null).map(t => t.id), ['b']);
});

test('focus countdown recovers from elapsed wall time and never becomes negative', () => {
  assert.equal(remainingSeconds({ phase: 'running', endsAt: 100000, remaining: 90 }, 40500), 60);
  assert.equal(remainingSeconds({ phase: 'running', endsAt: 100000, remaining: 90 }, 200000), 0);
  assert.equal(remainingSeconds({ phase: 'paused', endsAt: null, remaining: 47 }, 200000), 47);
});

test('backup validation rejects wrong formats, malformed tasks, and oversized imports', () => {
  const backup = { version: 1, tasks: [{ ...input, completed: true }], sessions: [] };
  assert.equal(parseBackup(JSON.stringify(backup)).tasks[0].completed, true);
  assert.throws(() => parseBackup('{broken'), /JSON/i);
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, version: 2 })), /version/i);
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, tasks: [{ ...input, completed: false, minutes: 0 }] })), /minutes/i);
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, tasks: Array(10001).fill(input) })), /10000/i);
});

test('cloud pagination retrieves histories beyond the API limit and propagates failed pages', async () => {
  const records = Array.from({ length: 1205 }, (_, id) => ({ id }));
  const result = await fetchPages(async (from, to) => ({ data: records.slice(from, Math.min(to + 1, from + 200)), error: null }));
  assert.deepEqual(result, records);
  await assert.rejects(fetchPages(async from => ({ data: from ? null : records.slice(0, 200), error: from ? new Error('Offline') : null })), /Offline/);
  let active = true;
  let calls = 0;
  await fetchPages(async () => { ++calls; active = false; return { data: records.slice(0, 200), error: null }; }, () => active);
  assert.equal(calls, 1);
});
