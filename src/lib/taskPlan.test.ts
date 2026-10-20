import { describe, expect, it } from 'vitest';
import { defaultFocus, reschedule, type Task } from './taskPlan';

const t = (id: string, due?: string, extra: Partial<Task> = {}): Task => ({ id, title: id, area: 'family', due, moved: 0, createdAt: `2026-10-0${id.length}T00:00:00Z`, ...extra });
const today = '2026-10-20';

describe('to-do planning', () => {
  it('picks overdue and due-today first, at most two', () => {
    const tasks = [t('a', '2026-10-25'), t('b', '2026-10-19'), t('c'), t('d', today)];
    expect(defaultFocus(tasks, today)).toEqual(['b', 'd']);
  });
  it('picks undated tasks when nothing is due', () => {
    expect(defaultFocus([t('a', '2026-10-30'), t('b')], today)).toEqual(['b']);
  });
  it('ignores done tasks', () => {
    expect(defaultFocus([t('a', today, { doneAt: 'x' })], today)).toEqual([]);
  });
  it('spreads the rest out, two a day, and counts the moves', () => {
    const tasks = [t('a', '2026-10-19'), t('b', today), t('c'), t('d'), t('e', '2026-10-21')];
    const next = reschedule(tasks, ['a'], today);
    const due = Object.fromEntries(next.map(x => [x.id, x.due]));
    expect(due.a).toBe('2026-10-19'); // in focus: unchanged
    expect(due.e).toBe('2026-10-21'); // already in the future: unchanged
    expect([due.b, due.c, due.d]).toEqual(['2026-10-21', '2026-10-22', '2026-10-22']);
    expect(next.find(x => x.id === 'b')!.moved).toBe(1);
    expect(next.find(x => x.id === 'c')!.moved).toBe(0); // had no date, not a move
  });
});
