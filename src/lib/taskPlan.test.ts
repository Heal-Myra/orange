import { describe, expect, it } from 'vitest';
import { defaultFocus, firstFreeDay, reschedule, type Task } from './taskPlan';

const t = (id: string, due?: string, extra: Partial<Task> = {}): Task => ({ id, title: id, area: 'family', due, moved: 0, createdAt: `2026-10-0${id.length}T00:00:00Z`, ...extra });
const today = '2026-10-20';

describe('to-do planning', () => {
  it('picks the most overdue task first, one at a time', () => {
    const tasks = [t('a', '2026-10-25'), t('b', '2026-10-19'), t('c'), t('d', today)];
    expect(defaultFocus(tasks, today)).toEqual(['b']);
  });
  it('picks undated tasks when nothing is due', () => {
    expect(defaultFocus([t('a', '2026-10-30'), t('b')], today)).toEqual(['b']);
  });
  it('ignores done tasks', () => {
    expect(defaultFocus([t('a', today, { doneAt: 'x' })], today)).toEqual([]);
  });
  it('keeps today\'s tasks, moves overdue ones, never more than three a day per group', () => {
    const tasks = [t('a', '2026-10-18'), t('b', today), t('c', today), t('d', '2026-10-19'), t('e', '2026-10-19'), t('f'), t('w', '2026-10-19', { area: 'work' })];
    const next = reschedule(tasks, ['a'], today);
    const due = Object.fromEntries(next.map(x => [x.id, x.due]));
    expect(due.a).toBe('2026-10-18'); // in focus: unchanged
    expect([due.b, due.c]).toEqual([today, today]); // today's stay
    expect(due.d).toBe(today); // third family slot today
    expect([due.e, due.f]).toEqual(['2026-10-21', '2026-10-21']);
    expect(due.w).toBe(today); // work has its own three
    expect(next.find(x => x.id === 'f')!.moved).toBe(0); // had no date, not a move
  });
  it('finds the first day with room', () => {
    const full = [t('a', today), t('b', today), t('c', today)];
    expect(firstFreeDay(full, 'family', today)).toBe('2026-10-21');
    expect(firstFreeDay(full, 'work', today)).toBe(today);
  });
});
