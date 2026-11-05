import { describe, expect, it } from 'vitest';
import { closeToRecord, findRecords } from './records';
import { DEFAULT_PROFILE as P, emptyDay, type DayLog } from './types';

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Days from 1 Sep 2026 on, with steps and breathing minutes given per day. */
function build(n: number, steps: (i: number) => number | undefined, med: (i: number) => number | undefined = () => undefined) {
  const days: Record<string, DayLog> = {};
  for (let i = 0; i < n; i++) {
    const iso = isoOf(new Date(2026, 8, 1 + i));
    const d = emptyDay(iso);
    const s = steps(i); if (s != null) d.activity = { steps: s };
    const m = med(i); if (m != null) d.mind = { meditationMin: m };
    days[iso] = d;
  }
  return days;
}

describe('your records (1 Nov 2026)', () => {
  it('finds a new best week of steps once there are earlier weeks to beat', () => {
    // 1 Sep 2026 is a Tuesday; weeks run Monday to Sunday. Steady 5,000 a day, then a big final full week.
    const days = build(41, i => (i >= 34 ? 9000 : 5000)); // 6 Oct (Mon) to 11 Oct (Sun) lifted
    const today = '2026-10-13';
    const week = findRecords(days, P, today).find(r => r.key === 'steps.week')!;
    expect(week.start).toBe('2026-10-05');
    expect(week.isNew).toBe(true);
    expect(week.beat).toBe(35000);
  });

  it('does not call the first days records', () => {
    const days = build(5, () => 8000);
    expect(findRecords(days, P, '2026-09-05')).toEqual([]);
  });

  it('finds the longest breathing streak and says when it is still going', () => {
    const days = build(20, () => undefined, i => (i < 3 || i >= 10 ? 10 : undefined));
    const s = findRecords(days, P, '2026-09-20').find(r => r.key === 'meditation.streak')!;
    expect(s.value).toBe(10);
    expect(s.ongoing).toBe(true);
    expect(s.isNew).toBe(true);
  });

  it('nudges when today is close to the best day', () => {
    const days = build(10, i => (i === 3 ? 10000 : i === 9 ? 8500 : 6000));
    expect(closeToRecord(days, P, '2026-09-10')).toMatchObject({ more: 1501 });
  });
});

describe('fresh records only (4 Nov 2026)', () => {
  it('shows a best only when yesterday completed it', async () => {
    const { freshRecords } = await import('./records');
    // 20 days of 6,000 steps, then yesterday 9,000 (a best day); today is the 21st.
    const days = build(20, i => (i === 19 ? 9000 : 6000));
    const r = freshRecords(days, P, '2026-09-21');
    expect(r.find(x => x.key === 'steps.day')).toMatchObject({ value: 9000, end: '2026-09-20' });
    // A day later the same best is stale: nothing for steps.day.
    expect(freshRecords(days, P, '2026-09-22').find(x => x.key === 'steps.day')).toBeUndefined();
  });

  it('a streak counts only while it runs through yesterday and is the longest', async () => {
    const { freshRecords } = await import('./records');
    const days = build(20, () => undefined, i => (i < 3 || i >= 14 ? 10 : undefined)); // 3 days, a gap, then 6 days to the 20th
    const s = freshRecords(days, P, '2026-09-21').find(x => x.key === 'meditation.streak')!;
    expect(s).toMatchObject({ value: 6, beat: 3, ongoing: true });
  });
});

describe('which fresh record shows first (6 Nov 2026)', async () => {
  const { recRank } = await import('./records');
  it('highest ever, then day, week, month, streak', () => {
    const list = [{ kind: 'week', title: 'Best week ever' }, { kind: 'streak', title: 'Longest gratitude streak' }, { kind: 'month', title: 'Best month ever' },
      { kind: 'day', title: 'Best day ever' }, { kind: 'day', title: 'Highest Mind score' }] as const;
    expect([...list].sort((a, b) => recRank(a) - recRank(b)).map(x => x.title)).toEqual(['Highest Mind score', 'Best day ever', 'Best week ever', 'Best month ever', 'Longest gratitude streak']);
  });
});
