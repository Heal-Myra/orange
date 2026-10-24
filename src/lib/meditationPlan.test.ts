import { describe, expect, it } from 'vitest';
import { newGoal, todaysLength } from './meditationPlan';
import { emptyDay } from './types';

const sat = (iso: string, m: number) => ({ ...emptyDay(iso), mind: { meditationMin: m } });

describe('meditation goal', () => {
  it('starts from where the person is and rises steadily to the goal', () => {
    const g = newGoal(20, 8, {}, '2026-10-24'); // 5 → 20 minutes in 8 weeks
    expect(g.start).toBe(5);
    expect(todaysLength(g, {}, '2026-10-24').minutes).toBe(5);
    expect(todaysLength(g, {}, '2026-11-21').minutes).toBe(13); // half way
    expect(todaysLength(g, {}, '2026-12-19')).toMatchObject({ minutes: 20, pace: 'reached' });
  });
  it('slows to the person\'s pace when sessions fall short', () => {
    const g = newGoal(20, 8, {}, '2026-10-24');
    const days = Object.fromEntries(['2026-11-18', '2026-11-19', '2026-11-20'].map(d => [d, sat(d, 6)]));
    expect(todaysLength(g, days, '2026-11-21')).toMatchObject({ minutes: 7, pace: 'gentler' });
  });
  it('never jumps more than 3 minutes above recent practice', () => {
    const g = { minutes: 30, by: '2026-11-01', start: 5, setAt: '2026-10-01' };
    const days = Object.fromEntries(['2026-10-28', '2026-10-29'].map(d => [d, sat(d, 24)]));
    expect(todaysLength(g, days, '2026-10-30').minutes).toBe(27);
  });
});
