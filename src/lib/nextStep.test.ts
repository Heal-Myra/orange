import { describe, expect, it } from 'vitest';
import { candidates, nextStep } from './nextStep';
import { wellBeing } from './scoring';
import { DEFAULT_PROFILE as P, emptyDay } from './types';

const day = () => emptyDay('2026-10-31');
const pick = (d = day(), hour = 9) => nextStep(d, P, wellBeing(d, P), hour);

describe("Myra's one recommendation", () => {
  it('in the morning with nothing logged, asks for last night\'s sleep (most points, suits the morning)', () => {
    expect(pick(day(), 8)).toMatchObject({ id: 'sleep', gain: 30, pillar: 'body' });
  });

  it('works out breathing points from the daily target: 10 of 20 minutes adds 15 Mind', () => {
    const d = day(); d.sleep = { hours: 8, quality: 5 };
    const c = candidates(d, P, wellBeing(d, P), 9).find(x => x.id === 'meditation')!;
    expect(c).toMatchObject({ minutes: 10, gain: 15 });
  });

  it('a 20-minute walk adds the steps and active-minute points it would earn', () => {
    const d = day(); d.activity = { steps: 6000, activeMin: 10 };
    const c = candidates(d, P, wellBeing(d, P), 13).find(x => x.id === 'movement')!;
    expect(c.gain).toBe(14); // 15 × 2000/8000 + 15 × 20/30 = 3.75 + 10
  });

  it('at bedtime suggests only winding down or the journal, never a walk or a meal', () => {
    const ids = candidates(day(), P, wellBeing(day(), P), 22.5).map(x => x.id);
    expect(ids).not.toContain('movement');
    expect(ids).not.toContain('food');
    expect(ids).toContain('nidra');
  });

  it('leaves out what is already full, and returns nothing when the day is complete', () => {
    const d = day();
    d.mind = { meditationMin: 20 };
    const ids = candidates(d, P, wellBeing(d, P), 23).map(x => x.id);
    expect(ids).not.toContain('nidra');
    expect(nextStep(d, P, wellBeing(d, P), 4)).toBeNull();
  });
});
