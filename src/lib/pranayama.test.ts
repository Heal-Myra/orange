import { describe, expect, it } from 'vitest';
import { phasesFor, sessionPlan } from './pranayama';

describe('guided pranayama', () => {
  it('fills the chosen time exactly, with stillness at the end', () => {
    for (const m of [5, 10, 15]) {
      const plan = sessionPlan('mix', m, 9);
      expect(plan.reduce((t, s) => t + s.seconds, 0)).toBe(m * 60);
      expect(plan.at(-1)!.id).toBe('still');
    }
  });
  it('uses the classic order by day and only calming breaths at night', () => {
    expect(sessionPlan('mix', 10, 7).map(s => s.id)).toEqual(['bhastrika', 'kapalbhati', 'anulom', 'bhramari', 'still']);
    const night = sessionPlan('mix', 15, 22).map(s => s.id);
    expect(night).not.toContain('bhastrika');
    expect(night).not.toContain('kapalbhati');
  });
  it('breathes in full rounds that roughly fill each part', () => {
    const ph = phasesFor({ id: 'anulom', seconds: 120 });
    const t = ph.reduce((a, b) => a + b.seconds, 0);
    expect(t).toBeGreaterThanOrEqual(110); expect(t).toBeLessThanOrEqual(130);
    expect(ph[0]).toMatchObject({ kind: 'in', side: 'left' });
    const k = phasesFor({ id: 'kapalbhati', seconds: 50 });
    expect(k.filter(x => x.kind === 'pump').length).toBe(30);
  });
});
