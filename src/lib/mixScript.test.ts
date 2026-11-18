import { describe, expect, it } from 'vitest';
import { mixScript, mixLines } from './mixScript';

describe("Myra's mix script (decision 0061)", () => {
  it('15 minutes runs close to 15 minutes, in the approved order', () => {
    const { events, total } = mixScript(15);
    expect(total).toBeGreaterThan(14 * 60);
    expect(total).toBeLessThan(16 * 60);
    const order = events.map(e => e.part).filter((p, i, a) => a.indexOf(p) === i);
    expect(order).toEqual(['arrive', 'bhastrika', 'kapalbhati', 'anulom', 'bhramari', 'om', 'still', 'close']);
  });
  it('rounds: 15 bellows breaths, 30 Kapalbhati strokes, ticks only for those', () => {
    const { events } = mixScript(15);
    expect(events.filter(e => e.part === 'kapalbhati' && e.tick).length).toBe(90);
    expect(events.filter(e => e.part === 'bhastrika' && e.tick).length).toBe(90);
    expect(events.filter(e => e.tick && !['kapalbhati', 'bhastrika'].includes(e.part)).length).toBe(0);
  });
  it('Myra speaks sparingly: never on a ticked breath', () => {
    expect(mixScript(15).events.filter(e => e.tick && e.say).length).toBe(0);
    expect(mixLines(15).length).toBeLessThan(60);
  });
  it('shorter sessions fit their time', () => {
    expect(mixScript(10).total).toBeLessThan(11 * 60);
    expect(mixScript(5).total).toBeLessThan(6.5 * 60);
  });
});
