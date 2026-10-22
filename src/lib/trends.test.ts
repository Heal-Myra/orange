import { describe, expect, it } from 'vitest';
import { METRICS, periodOf, trendOf } from './trends';
import { DEFAULT_PROFILE, emptyDay } from './types';

describe('trend periods', () => {
  it('a week runs Monday to Sunday', () => {
    const p = periodOf('W', '2026-10-22'); // Thursday
    expect([p.start, p.end, p.buckets.length]).toEqual(['2026-10-19', '2026-10-25', 7]);
    expect(periodOf('W', '2026-10-22', 1).start).toBe('2026-10-12');
  });
  it('month, quarter and year', () => {
    expect(periodOf('M', '2026-10-22').buckets.length).toBe(31);
    const q = periodOf('Q', '2026-10-22');
    expect([q.start, q.end]).toEqual(['2026-10-01', '2026-12-31']);
    expect(q.buckets[0].start).toBe('2026-10-01');
    expect(periodOf('Y', '2026-10-22').buckets.length).toBe(12);
    expect(periodOf('Q', '2026-02-10', 1).start).toBe('2025-10-01');
  });
});

describe('trends', () => {
  const steps = METRICS.find(m => m.id === 'steps')!;
  const day = (iso: string, n?: number) => ({ ...emptyDay(iso), activity: n == null ? {} : { steps: n } });
  const days = {
    '2026-10-13': day('2026-10-13', 4000), '2026-10-14': day('2026-10-14', 6000),
    '2026-10-19': day('2026-10-19', 8000), '2026-10-20': day('2026-10-20'), '2026-10-21': day('2026-10-21', 10000),
  };
  it('averages only days with data and compares with the period before', () => {
    const t = trendOf(steps, days, DEFAULT_PROFILE, 'W', '2026-10-22', 0, '2026-10-22');
    expect(t.value).toBe(9000);
    expect(t.previous).toBe(5000);
    expect(t.change).toBe(4000);
    expect(t.bars.slice(0, 4)).toEqual([8000, null, 10000, null]);
    expect(t.bars[6]).toBeNull(); // Sunday is still to come
  });
  it('counts days for yes/no habits', () => {
    const learning = METRICS.find(m => m.id === 'learning')!;
    const d = { '2026-10-19': { ...emptyDay('2026-10-19'), mind: { learned: { text: 'How tides work' } } } };
    expect(trendOf(learning, d, DEFAULT_PROFILE, 'W', '2026-10-22', 0, '2026-10-22').value).toBe(1);
  });
});
