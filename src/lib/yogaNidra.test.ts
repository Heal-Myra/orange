import { describe, expect, it } from 'vitest';
import { nidraMinutes, nidraScript } from './yogaNidra';

describe('Yoga Nidra', () => {
  it('lasts about a quarter of an hour, in both languages', () => {
    for (const bed of [true, false]) {
      const s = nidraScript(bed);
      expect(nidraMinutes(s)).toBeGreaterThanOrEqual(11);
      expect(nidraMinutes(s)).toBeLessThanOrEqual(20);
      expect(s.every(x => x.en && x.hi)).toBe(true);
    }
  });
  it('at bedtime it ends in sleep, not by sitting up', () => {
    expect(nidraScript(true).at(-1)!.en).toMatch(/sleep/);
    expect(nidraScript(false).at(-1)!.en).toMatch(/sit up/);
  });
});
