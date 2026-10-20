// Pure planning rules for the to-do list (no app code), so they can be tested. See src/lib/tasks.tsx.

import { shiftISO } from './dates';

export type Area = 'family' | 'work' | 'self';
export const AREAS: { id: Area; name: string }[] = [
  { id: 'family', name: 'Family' },
  { id: 'work', name: 'Work' },
  { id: 'self', name: 'Better me' },
];
export const areaName = (a: Area) => AREAS.find(x => x.id === a)?.name ?? a;

export interface Task {
  id: string;
  title: string;
  area: Area;
  due?: string; // yyyy-mm-dd
  doneAt?: string;
  moved: number; // how many times it was moved to another day
  createdAt: string;
}

export const FOCUS_MAX = 1; // one task in front of the person at a time; Myra rotates (founder, 21 Oct 2026)
const PER_DAY = 2; // tasks given the same new date when rescheduling

export const sortOpen = (a: Task, b: Task) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.createdAt.localeCompare(b.createdAt);

/** The default pick: overdue and due-today first, then the oldest task without a date. */
export function defaultFocus(tasks: Task[], today: string): string[] {
  const open = tasks.filter(t => !t.doneAt).sort(sortOpen);
  const due = open.filter(t => t.due && t.due <= today);
  const undated = open.filter(t => !t.due);
  return [...due, ...undated].slice(0, FOCUS_MAX).map(t => t.id);
}

/** Give every task that was due (or had no date) but is not in today's focus a new date, at most PER_DAY a day. */
export function reschedule(tasks: Task[], focusIds: string[], today: string): Task[] {
  const load: Record<string, number> = {};
  for (const t of tasks) if (!t.doneAt && t.due && t.due > today) load[t.due] = (load[t.due] ?? 0) + 1;
  const nextFree = () => {
    for (let i = 1; i < 366; i++) {
      const d = shiftISO(today, i);
      if ((load[d] ?? 0) < PER_DAY) { load[d] = (load[d] ?? 0) + 1; return d; }
    }
    return shiftISO(today, 1);
  };
  return tasks.map(t => {
    if (t.doneAt || focusIds.includes(t.id)) return t;
    if (t.due && t.due > today) return t;
    return { ...t, due: nextFree(), moved: t.due ? t.moved + 1 : t.moved };
  });
}

/** Short lines for the AI, so Myra can pick today's focus. */
export function tasksForAI(open: Task[], today: string): string {
  if (!open.length) return 'To-do list: empty.';
  return 'To-do list (id | group | task | due | times moved):\n' + open.slice(0, 20).map(t =>
    `${t.id} | ${areaName(t.area)} | ${t.title} | ${t.due ? (t.due < today ? `overdue (${t.due})` : t.due === today ? 'today' : t.due) : 'no date'} | ${t.moved}`).join('\n');
}
