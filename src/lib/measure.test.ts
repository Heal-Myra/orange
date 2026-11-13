import { describe, expect, it } from 'vitest';
import { lastMeasure, measureDue, measureLine } from './measure';
import type { DayLog } from './types';

const d = (waist?: number, weight?: number) => ({ meals: [], health: { waistCm: waist, weightKg: weight } } as unknown as DayLog);

describe('Measure day (13 Nov 2026)', () => {
  it('is due on the 1st to 3rd until measured that month', () => {
    expect(measureDue({}, '2026-12-01')).toBe(true);
    expect(measureDue({}, '2026-12-04')).toBe(false);
    expect(measureDue({ '2026-12-02': d(88) }, '2026-12-03')).toBe(false);
  });
  it('compares with the last measure', () => {
    const days = { '2026-11-01': d(90, 75), '2026-12-01': d(88, 74) };
    const now = lastMeasure(days, '2026-12-01')!, was = lastMeasure(days, '2026-12-01', true);
    expect(was?.waist).toBe(90);
    expect(measureLine(now, was)).toEqual(['Waist down {n} cm: keep it going.', { n: 2 }]);
  });
});
