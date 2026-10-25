import { describe, expect, it } from 'vitest';

describe('3 pm weight nudge', () => {
  it('knows when today already has a weight', async () => {
    const { weighedOn } = await import('./weightNudge');
    const start = new Date(2026, 9, 25).getTime();
    expect(weighedOn({ health: { weightAt: start + 7 * 3600e3 } }, start)).toBe(true);   // scale at 7 am
    expect(weighedOn({ health: { weightAt: start - 3600e3 } }, start)).toBe(false);      // yesterday's weighing
    expect(weighedOn({ health: { weightTyped: true, weightTypedAt: start + 3600e3 } }, start)).toBe(true);
    expect(weighedOn(undefined, start)).toBe(false);
  });
  it('only nudges people who weigh on a scale', async () => {
    const { usesScale } = await import('./weightNudge');
    const now = Date.now();
    expect(usesScale({ a: { health: { weightAt: now - 2 * 86_400_000 } } }, now)).toBe(true);
    expect(usesScale({ a: { health: {} } }, now)).toBe(false);
  });
});
