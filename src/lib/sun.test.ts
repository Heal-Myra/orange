import { describe, expect, it } from 'vitest';
import { skyHour, sunTimes } from './sun';

describe('sunrise by place (founder, 23 Nov 2026)', () => {
  it('gives Mumbai and Delhi sensible times in late November', () => {
    const d = new Date('2026-11-23T12:00:00+05:30');
    const off = d.getTimezoneOffset(); // the test machine's clock; compare in IST
    const ist = (h: number) => h + (330 + off) / 60;
    const m = sunTimes(d, 19.08, 72.88)!, dl = sunTimes(d, 28.61, 77.21)!;
    expect(ist(m.rise)).toBeGreaterThan(6.8); expect(ist(m.rise)).toBeLessThan(7.2);   // ~6:58
    expect(ist(m.set)).toBeGreaterThan(17.8); expect(ist(m.set)).toBeLessThan(18.2);   // ~18:01
    expect(ist(dl.rise)).toBeGreaterThan(6.7); expect(ist(dl.rise)).toBeLessThan(7.1); // ~6:56
  });
  it('maps sunrise to dawn and sunset to dusk', () => {
    const sun = { rise: 7, set: 18 };
    expect(skyHour(7, sun)).toBeCloseTo(6.2); expect(skyHour(18, sun)).toBeCloseTo(18); expect(skyHour(12.5, sun)).toBeGreaterThan(11);
    expect(skyHour(9, null)).toBe(9);
  });
});
