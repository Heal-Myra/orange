import { describe, expect, it } from 'vitest';
import { parseGoal, planFor, restingKcal, type AboutMe } from './targets';

const base: AboutMe = { weightKg: 84, heightCm: 178, sex: 'male', age: 42, goal: 'keep', setAt: '2026-10-20' };

describe('targets', () => {
  it('resting energy follows Mifflin-St Jeor', () => {
    expect(restingKcal(base)).toBe(10 * 84 + 6.25 * 178 - 5 * 42 + 5);
  });

  it('keeps weight at about 1.4 × resting energy', () => {
    const p = planFor(base);
    expect(p.kcal).toBe(Math.round((restingKcal(base) * 1.4) / 50) * 50);
    expect(p.weeklyKg).toBe(0);
  });

  it('plans a safe loss and slows down a pace that is too fast', () => {
    const p = planFor({ ...base, goal: 'lose', goalKg: 10, goalWeeks: 4 });
    expect(p.weeklyKg).toBeGreaterThanOrEqual(-0.75);
    expect(p.slowedDown).toBe(true);
    expect(p.weeks).toBeGreaterThanOrEqual(14);
    expect(p.kcal).toBeGreaterThanOrEqual(1500);
  });

  it('never plans food below the floor for a smaller woman', () => {
    const p = planFor({ weightKg: 52, heightCm: 152, sex: 'female', age: 35, goal: 'lose', goalKg: 5, goalWeeks: 8, setAt: '' });
    expect(p.kcal).toBeGreaterThanOrEqual(1200);
  });

  it('gives no weight goal under 18', () => {
    const p = planFor({ ...base, age: 16, goal: 'lose', goalKg: 5, goalWeeks: 10 });
    expect(p.adult).toBe(false);
    expect(p.weeklyKg).toBe(0);
  });

  it('protein uses a healthy reference weight when BMI is over 30', () => {
    const heavy = planFor({ ...base, weightKg: 120, goal: 'lose', goalKg: 10, goalWeeks: 20 });
    expect(heavy.protein).toBeLessThan(120 * 1.4);
  });

  it('reads a goal written in plain words', () => {
    expect(parseGoal('I want to lose 5 kg in 3 months')).toEqual({ goal: 'lose', goalKg: 5, goalWeeks: 13 });
    expect(parseGoal('gain 4kg in 8 weeks')).toEqual({ goal: 'gain', goalKg: 4, goalWeeks: 8 });
    expect(parseGoal('run 5 km and sleep better')).toEqual({ goal: 'keep' });
    const by = parseGoal('reduce 10 kg by March', new Date(2026, 9, 21));
    expect(by.goal).toBe('lose');
    expect(by.goalWeeks).toBeGreaterThan(20);
  });
});
