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
  it('scores practices alone when social media is not logged (meditation now counts in Soul)', () => {
    const d = day();
    d.mind = { meditationMin: 20, attention: true, learning: true };
    const m = mindScore(d, P)!;
    expect(m.practices).toBe(30);
    expect(m.content).toBeNull();
    expect(m.total).toBe(30);
  });

  it('gives the full content score for a day without social media', () => {
    const d = day();
    d.noMedia = true;
    expect(mindScore(d, P)!.content).toBe(70);
  });

  it('weights content by minutes and category', () => {
    const d = day();
    d.media = [
      { platform: 'YouTube', minutes: 30, category: 'learning' },
      { platform: 'Instagram', minutes: 30, category: 'scrolling' },
    ];
    const m = mindScore(d, P)!;
    expect(m.quality).toBeCloseTo(0.6);
    expect(m.content).toBeCloseTo(40 * 0.6 + 30);
  });

  it('drops quantity points to zero at three times the limit', () => {
    const d = day();
    d.media = [{ platform: 'Instagram', minutes: 180, category: 'learning' }];
    expect(mindScore(d, P)!.content).toBeCloseTo(40);
  });
});

describe('soul', () => {
  it('gives 0.4 of each kept practice\'s weight (eight practices worth 40)', () => {
    const d = day();
    d.dharma = { satya: true, nyaya: true };
    expect(soulScore(d)!.total).toBe(14);
  });

  it('adds up to 20 for breathing and meditation against the daily target', () => {
    const d = day();
    d.mind = { meditationMin: P.meditation / 2 };
    expect(soulScore(d, P)!.meditation).toBe(10);
    expect(mindScore(d, P)).toBeNull();
  });

  it('adds 15 for the verse, 5 per gratitude (max 15) and 10 for a thought', () => {
    const d = day();
    d.soul = { verseStudied: true, gratitude: ['family', 'health', 'rain', 'tea'], thought: 'Be gentle today' };
    const s = soulScore(d)!;
    expect(s.verse).toBe(15);
    expect(s.gratitude).toBe(15);
    expect(s.thought).toBe(10);
    expect(s.total).toBe(40);
  });

  it('reaches 100 with all practices kept, meditation done and all three cards done', () => {
    const d = day();
    d.dharma = { satya: true, nyaya: true, kartavya: true, seva: true, ahimsa: true, daana: true, santosha: true, kritajnata: true };
    d.soul = { checked: true, verseStudied: true, gratitude: ['a', 'b', 'c'], thought: 'Let go' };
    d.mind = { meditationMin: P.meditation };
    expect(soulScore(d, P)!.total).toBe(100);
  });

  it('counts answering the check even when every practice slipped', () => {
    const d = day();
    d.soul = { checked: true };
    expect(soulScore(d)!.total).toBe(0);
  });

  it('caps the reflection bonus at plus 10 and the total at 100', () => {
    const d = day();
    d.dharma = { satya: true, nyaya: true, kartavya: true, seva: true, ahimsa: true, daana: true, santosha: true, kritajnata: true };
    d.soul = { verseStudied: true, gratitude: ['a', 'b', 'c'], thought: 'Let go' };
    d.mind = { meditationMin: P.meditation };
    d.actions = Array.from({ length: 5 }, () => ({ text: 'helped', principle: 'Seva', alignment: 2 }));
    const s = soulScore(d, P)!;
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

describe('Tao practice', () => {
  // 2026-10-19 is a Monday (observation, Mind); 2026-10-21 is a Wednesday (antidote, Soul).
  it('adds 10 to Mind on a Mind day, nothing to Soul', () => {
    const d = emptyDay('2026-10-19');
    d.tao = { done: true };
    expect(mindScore(d, P)!.total).toBe(10);
    expect(soulScore(d)).toBeNull();
  });

  it('adds 10 to Soul on a Soul day, nothing to Mind', () => {
    const d = emptyDay('2026-10-21');
    d.tao = { done: true };
    expect(soulScore(d)!.total).toBe(10);
    expect(mindScore(d, P)).toBeNull();
  });

  it('never takes Mind or Soul above 100', () => {
    const m = emptyDay('2026-10-19');
    m.tao = { done: true };
    m.mind = { meditationMin: 20, attention: true, learning: true };
    m.noMedia = true;
    expect(mindScore(m, P)!.total).toBe(100);
    const s = emptyDay('2026-10-21');
    s.tao = { done: true };
    s.dharma = { satya: true, nyaya: true, kartavya: true, seva: true, ahimsa: true, daana: true, santosha: true, kritajnata: true };
    s.soul = { verseStudied: true, gratitude: ['a', 'b', 'c'], thought: 'Let go' };
    s.mind = { meditationMin: P.meditation };
    expect(soulScore(s, P)!.total).toBe(100);
  });

  it('does nothing when only a note is written', () => {
    const d = emptyDay('2026-10-19');
    d.tao = { note: 'chasing approval' };
    expect(mindScore(d, P)).toBeNull();
    expect(soulScore(d)).toBeNull();
  });
});
