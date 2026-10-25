import { describe, expect, it } from 'vitest';
import { feelingLine, gentleToday } from './feeling';
import { sessionPlan } from './pranayama';

describe('how I feel today', () => {
  it('tells Myra to shape every suggestion around a cold', () => {
    const line = feelingLine({ mood: 'unwell', symptoms: ['cold'], at: '2026-10-24T08:00:00Z' });
    expect(line).toContain('cold');
    expect(line).toContain('EVERY suggestion');
    expect(line).toContain('warm fluids');
  });
  it('leaves strong breaths out of the guided mix on a gentle day', () => {
    const f = { mood: 'unwell' as const, symptoms: ['cold' as const], at: '' };
    expect(gentleToday(f)).toBe(true);
    const ids = sessionPlan('mix', 10, 9, gentleToday(f)).map(s => s.id);
    expect(ids).not.toContain('bhastrika');
    expect(ids).not.toContain('kapalbhati');
  });
});

describe('reading how I feel from my own words', () => {
  it('finds symptoms in a sentence, in English or Hindi', async () => {
    const { symptomsIn } = await import('./feeling');
    expect(symptomsIn('I have a cold and a mild headache')).toEqual(['cold', 'headache']);
    expect(symptomsIn('आज ज़ुकाम है')).toEqual(['cold']);
    expect(symptomsIn('Feeling great today')).toEqual([]);
  });
});

describe('care plan', () => {
  it('switches on food, breathing, movement and rest for a cold', async () => {
    const { carePlan } = await import('./care');
    const c = carePlan(['cold'])!;
    expect(c.food.join(' ')).toMatch(/Ginger-tulsi/);
    expect(c.breath).toEqual(['anulom', 'ujjayi', 'bhramari']);
    expect(c.move).toMatch(/gentle/);
    const plan = sessionPlan('mix', 10, 9, true, c.breath).map(s => s.id);
    expect(plan).toEqual(['anulom', 'ujjayi', 'bhramari', 'still']);
  });
  it('a fever means rest, not exercise', async () => {
    const { carePlan } = await import('./care');
    expect(carePlan(['cold', 'fever'])!.move).toMatch(/No exercise/);
  });
});
