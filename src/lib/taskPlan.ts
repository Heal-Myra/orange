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
/** At most three to-dos a day in each group (founder, 23 Oct 2026). */
export const PER_AREA_DAY = 3;

export const sortOpen = (a: Task, b: Task) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.createdAt.localeCompare(b.createdAt);

/** The default pick: overdue and due-today first, then the oldest task without a date. */
export function defaultFocus(tasks: Task[], today: string): string[] {
  const open = tasks.filter(t => !t.doneAt).sort(sortOpen);
  const due = open.filter(t => t.due && t.due <= today);
  const undated = open.filter(t => !t.due);
  return [...due, ...undated].slice(0, FOCUS_MAX).map(t => t.id);
}

/** How many open to-dos a group already has on a day. */
export const loadOn = (tasks: Task[], area: Area, day: string, except?: string) =>
  tasks.filter(t => !t.doneAt && t.area === area && t.due === day && t.id !== except).length;

/** The first day from `from` on that still has room in this group (at most three a day). */
export function firstFreeDay(tasks: Task[], area: Area, from: string): string {
  for (let i = 0; i < 366; i++) { const d = shiftISO(from, i); if (loadOn(tasks, area, d) < PER_AREA_DAY) return d; }
  return from;
}

/** Each morning: overdue tasks (and tasks with no date) that are not today's focus get a new date, keeping at most
 *  three a day in each group. Tasks dated today stay on today's list (founder, 23 Oct 2026: show today's list). */
export function reschedule(tasks: Task[], focusIds: string[], today: string): Task[] {
  const next = tasks.map(t => ({ ...t }));
  for (const t of next) {
    if (t.doneAt || focusIds.includes(t.id)) continue;
    if (t.due && t.due >= today) continue;
    const day = firstFreeDay(next, t.area, today);
    t.moved = t.due ? t.moved + 1 : t.moved;
    t.due = day;
  }
  return next.map((t, i) => (t.due === tasks[i].due && t.moved === tasks[i].moved ? tasks[i] : t));
}

/** Short lines for the AI, so Myra can pick today's focus. */
export function tasksForAI(open: Task[], today: string): string {
  if (!open.length) return 'To-do list: empty.';
  return 'To-do list (id | group | task | due | times moved):\n' + open.slice(0, 20).map(t =>
    `${t.id} | ${areaName(t.area)} | ${t.title} | ${t.due ? (t.due < today ? `overdue (${t.due})` : t.due === today ? 'today' : t.due) : 'no date'} | ${t.moved}`).join('\n');
}
