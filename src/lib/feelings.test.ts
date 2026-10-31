import { describe, expect, it } from 'vitest';
import { cleanFeelings, feelingMix, heavyShare } from './feelings';
import type { MediaSession } from './types';

const s = (minutes: number, category: MediaSession['category'], group: MediaSession['group'] = 'social'): MediaSession =>
  ({ platform: 'Other', app: 'x', minutes, category, group } as MediaSession);

describe('what you fed your mind', () => {
  it('weighs each app by its minutes and kind of content', () => {
    const r = feelingMix([s(60, 'connect'), s(60, 'negative')])!;
    expect(r.minutes).toBe(120);
    expect(r.mix.love).toBeCloseTo(0.375);
    expect(heavyShare(r.mix)).toBeCloseTo(0.5);
    const total = Object.values(r.mix).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1);
  });
  it('leaves out tools and adds shared posts as 10 minutes each', () => {
    const r = feelingMix([s(30, 'fun'), s(500, 'news', 'tool')], [{ title: 't', feelings: { hope: 1 }, at: 'x' }])!;
    expect(r.minutes).toBe(40);
    expect(r.mix.hope).toBeCloseTo(0.25);
  });
  it('returns nothing without data, and cleans the AI answer', () => {
    expect(feelingMix([])).toBeNull();
    expect(cleanFeelings({ love: 2, fear: 2, rage: 5 })).toEqual({ love: 0.5, fear: 0.5 });
    expect(cleanFeelings('x')).toBeNull();
  });
});
