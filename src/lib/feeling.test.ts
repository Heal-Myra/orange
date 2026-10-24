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
