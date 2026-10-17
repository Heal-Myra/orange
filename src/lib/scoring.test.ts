import { describe, expect, it } from 'vitest';
import { band, bodyScore, mindScore, soulScore, wellBeing } from './scoring';
import { DEFAULT_PROFILE as P, emptyDay } from './types';

const day = () => emptyDay('2026-10-17');

describe('nothing logged', () => {
  it('gives null pillars and a total of zero', () => {
    const w = wellBeing(day(), P);
    expect(w.body).toBeNull();
    expect(w.mind).toBeNull();
    expect(w.soul).toBeNull();
    expect(w.total).toBe(0);
    expect(w.logged).toBe(0);
  });
});

describe('body', () => {
  it('gives full movement at target steps and minutes', () => {
    const d = day();
    d.activity = { steps: 8000, activeMin: 30 };
    expect(bodyScore(d, P)!.movement).toBe(40);
  });

  it('caps movement at 40 above target', () => {
    const d = day();
    d.activity = { steps: 20000, activeMin: 90 };
    expect(bodyScore(d, P)!.movement).toBe(40);
  });

  it('gives full sleep for 8 hours of quality 5', () => {
    const d = day();
    d.sleep = { hours: 8, quality: 5 };
    expect(bodyScore(d, P)!.sleep).toBe(30);
  });

  it('reduces sleep points for short sleep', () => {
    const d = day();
    d.sleep = { hours: 5, quality: 3 };
    expect(bodyScore(d, P)!.sleep).toBeCloseTo(10 + 6);
  });

  it('gives full nutrition for on-target, balanced eating', () => {
    const d = day();
    // 2000 kcal: protein 100 g (400), carbs 250 g (1000), fat 66.7 g (600)
    d.meals = [{ name: 'Day', kcal: 2000, p: 100, c: 250, f: 600 / 9, source: 'manual' }];
    expect(bodyScore(d, P)!.nutrition).toBeCloseTo(30);
  });
});

describe('mind', () => {
  it('scores practices alone when social media is not logged', () => {
    const d = day();
    d.mind = { meditationMin: 20, attention: true, learning: true };
    const m = mindScore(d, P)!;
    expect(m.practices).toBe(40);
    expect(m.content).toBeNull();
    expect(m.total).toBe(40);
  });

  it('gives the full content score for a day without social media', () => {
    const d = day();
    d.noMedia = true;
    expect(mindScore(d, P)!.content).toBe(60);
  });

  it('weights content by minutes and category', () => {
    const d = day();
    d.media = [
      { platform: 'YouTube', minutes: 30, category: 'learning' },
      { platform: 'Instagram', minutes: 30, category: 'scrolling' },
    ];
    const m = mindScore(d, P)!;
    expect(m.quality).toBeCloseTo(0.6);
    expect(m.content).toBeCloseTo(35 * 0.6 + 25);
  });

  it('drops quantity points to zero at three times the limit', () => {
    const d = day();
    d.media = [{ platform: 'Instagram', minutes: 180, category: 'learning' }];
    expect(mindScore(d, P)!.content).toBeCloseTo(35);
  });
});

describe('soul', () => {
  it('adds the points of kept practices', () => {
    const d = day();
    d.dharma = { satya: true, nyaya: true };
    expect(soulScore(d)!.total).toBe(35);
  });

  it('caps the reflection bonus at plus 10 and the total at 100', () => {
    const d = day();
    d.dharma = { satya: true, nyaya: true, kartavya: true, seva: true, ahimsa: true, daana: true, santosha: true, kritajnata: true };
    d.actions = Array.from({ length: 5 }, () => ({ text: 'helped', principle: 'Seva', alignment: 2 }));
    const s = soulScore(d)!;
    expect(s.bonus).toBe(10);
    expect(s.total).toBe(100);
  });

  it('never goes below zero', () => {
    const d = day();
    d.actions = [{ text: 'lied', principle: 'Satya', alignment: -2 }];
    expect(soulScore(d)!.total).toBe(0);
  });
});

describe('band', () => {
  it('maps totals to labels', () => {
    expect(band(250)).toBe('Flourishing');
    expect(band(200)).toBe('Balanced');
    expect(band(130)).toBe('Finding your footing');
    expect(band(50)).toBe('Needs care');
  });
});
