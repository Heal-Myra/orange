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
