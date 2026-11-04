import { describe, expect, it } from 'vitest';
import { minutesFor, pathState, stageOf, type DhammaDay } from './dhamma';
import { practicesFor } from './medAims';
import { emptyDay, type DayLog } from './types';

const days = (map: Record<string, DhammaDay>) => Object.fromEntries(Object.entries(map).map(([k, v]) => {
  const d: DayLog = emptyDay(k); d.mind = { dhamma: v }; return [k, d];
}));
const sit = (step: number, feel?: 'calm' | 'restless' | 'uneasy') => ({ step, min: 10, at: '', feel });

describe('Dhamma path', () => {
  it('goes one step a day, in order; a missed day just continues', () => {
    const p = pathState(days({ '2026-11-05': { begun: { gentle: false, at: '' }, sits: [sit(1, 'calm')] }, '2026-11-07': { sits: [sit(2, 'calm')] } }), '2026-11-08');
    expect(p).toMatchObject({ active: true, next: 3, done: [1, 2], finished: false });
    expect(p.today).toBeUndefined();
  });
  it('restless repeats the step; uneasy repeats it shorter', () => {
    const r = pathState(days({ '2026-11-05': { begun: { gentle: false, at: '' }, sits: [sit(1, 'restless')] } }), '2026-11-05');
    expect(r.next).toBe(1);
    expect(r.today?.feel).toBe('restless');
    const u = pathState(days({ '2026-11-05': { begun: { gentle: false, at: '' }, sits: [sit(1, 'uneasy')] } }), '2026-11-06');
    expect(u).toMatchObject({ next: 1, soft: true });
    expect(minutesFor(1, false, true)).toBe(6);
  });
  it('lengths: 10 → 15 on the breath, 15 → 30 on the body, 15 for kindness; gentle path at most 10', () => {
    expect([1, 3, 4, 9, 10].map(s => minutesFor(s, false, false))).toEqual([10, 15, 15, 30, 15]);
    expect(minutesFor(9, true, false)).toBe(10);
    expect([1, 4, 10, 11].map(stageOf)).toEqual(['breath', 'body', 'kind', 'body']);
  });
  it('after Day 10 the path is finished; leaving it stops it', () => {
    const all = Object.fromEntries(Array.from({ length: 10 }, (_, k) => [`2026-11-${String(k + 1).padStart(2, '0')}`, { ...(k ? {} : { begun: { gentle: false, at: '' } }), sits: [sit(k + 1, 'calm')] }]));
    expect(pathState(days(all), '2026-11-12')).toMatchObject({ finished: true, next: 11 });
    expect(pathState(days({ ...all, '2026-11-12': { left: true } }), '2026-11-12').active).toBe(false);
  });
});

describe('help with: Myra picks a practice', () => {
  it('focus → Anulom Vilom first; energy has no strong breaths after 6 pm or on the gentle path', () => {
    expect(practicesFor('focus', 9).list[0]).toBe('anulom');
    expect(practicesFor('energy', 8).list[0]).toBe('bhastrika');
    expect(practicesFor('energy', 19)).toEqual({ list: ['ujjayi'], noEnergy: true });
    expect(practicesFor('energy', 8, true).list).toEqual(['ujjayi']);
  });
});
