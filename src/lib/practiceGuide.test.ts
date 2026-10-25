import { describe, expect, it } from 'vitest';
import { checksFor, GUIDES } from './practiceGuide';
import { HI } from './hi';
import { figure, LEFT, RIGHT } from './guideFigure';

describe('practice explainers', () => {
  it('every step has a time, a line, and Hindi for Myra to say', () => {
    for (const [id, steps] of Object.entries(GUIDES)) {
      expect(steps!.length, id).toBeGreaterThan(2);
      for (const s of steps!) {
        expect(s.seconds).toBeGreaterThan(0);
        expect((HI as Record<string, string>)[s.say], s.say).toBeTruthy();
      }
    }
  });
  it('Anulom Vilom: thumb closes the right nostril while breathing in through the left', () => {
    const s = GUIDES.anulom!.find(x => x.breath === 'in' && x.through === 'left')!;
    expect(s.pose.right).toBe('thumb');
    expect(checksFor(s)).toContainEqual({ kind: 'handAt', hand: 'right', part: 'thumb', target: 'rightNostril' });
  });
  it('draws every pose without gaps', () => {
    for (const r of Object.values(RIGHT)) for (const l of Object.values(LEFT)) {
      const shapes = figure({ right: r, left: l, settled: true, mouth: 'closed', breath: 'in', through: 'nose', p: 0.5, time: 1, level: 0.5 });
      expect(shapes.every(sh => sh.t !== 'path' || !/NaN/.test(sh.d))).toBe(true);
    }
  });
});
