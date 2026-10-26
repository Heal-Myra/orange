import { describe, expect, it } from 'vitest';
import { band, bodyScore, foodScore, mindScore, soulScore, wellBeing } from './scoring';
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
    expect(bodyScore(d, P)!.movement).toBe(30);
  });

  it('caps movement at 30 above target', () => {
    const d = day();
    d.activity = { steps: 20000, activeMin: 90 };
    expect(bodyScore(d, P)!.movement).toBe(30);
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

  it('gives full food points for a protein- and fibre-rich day at or under the target', () => {
    const d = day();
    // 1,600 kcal: protein 110 g (27 %), fat 45 g (25 %), fibre 30 g
    d.meals = [{ name: 'Day', kcal: 1600, p: 110, c: 170, f: 45, fib: 30, source: 'manual' }];
    expect(bodyScore(d, P)!.nutrition).toBeCloseTo(40);
  });

  it('scores a carb- and fat-heavy day lower than a protein- and fibre-rich one of the same calories', () => {
    const rich = foodScore({ kcal: 1500, p: 100, c: 160, f: 40, fib: 28 }, 2000);
    const heavy = foodScore({ kcal: 1500, p: 35, c: 200, f: 70, fib: 8 }, 2000);
    expect(rich.total).toBeGreaterThan(heavy.total + 10);
  });

  it('scores a declared fast in full while only tea or coffee went in', () => {
    const d = day();
    d.fasting = true;
    expect(bodyScore(d, P)!.nutrition).toBe(40);
    d.meals = [{ name: 'Black coffee', kcal: 5, p: 0, c: 1, f: 0, source: 'words' }];
    expect(bodyScore(d, P)!.nutrition).toBe(40);
    d.meals.push({ name: 'Paratha', kcal: 300, p: 6, c: 40, f: 12, source: 'words' });
    expect(bodyScore(d, P)!.nutrition).toBeLessThan(40);
  });

  it('does not reward going over the calorie target', () => {
    expect(foodScore({ kcal: 2800, p: 140, c: 300, f: 80, fib: 30 }, 2000).kcal).toBe(0);
    expect(foodScore({ kcal: 900, p: 60, c: 90, f: 25, fib: 15 }, 2000).kcal).toBe(16);
  });
});

describe('mind (focus to-dos 40, meditation 30, phone activity 30)', () => {
  it('scores focus to-dos, 20 each up to two', () => {
    const d = day();
    d.mind = { focusDone: 3 };
    expect(mindScore(d, P)!.practices).toBe(40);
    d.mind = { focusDone: 1 };
    expect(mindScore(d, P)!.practices).toBe(20);
  });
  it('scores breathing and meditation against the daily target', () => {
    const d = day();
    d.mind = { meditationMin: P.meditation / 2 };
    expect(mindScore(d, P)!.meditation).toBe(15);
    expect(soulScore(d, P)).toBeNull();
  });
  it('no longer scores learning', () => {
    const d = day();
    d.mind = { learned: { text: 'How compound interest works' } };
    expect(mindScore(d, P)).toBeNull();
  });
  it('scores phone activity out of 30: quality 18 and within the limit 12', () => {
    const d = day();
    d.media = [{ platform: 'YouTube', minutes: 30, category: 'learning' }, { platform: 'Instagram', minutes: 30, category: 'scrolling' }];
    expect(mindScore(d, P)!.content).toBeCloseTo(18 * 0.6 + 12);
    d.media = [{ platform: 'Instagram', minutes: 180, category: 'learning' }];
    expect(mindScore(d, P)!.content).toBeCloseTo(18);
  });
  it('reaches 100 with all three parts', () => {
    const d = day();
    d.mind = { focusDone: 2, meditationMin: P.meditation };
    d.noMedia = true;
    expect(mindScore(d, P)!.total).toBe(100);
  });
});

describe('soul (gratitude 30, love 30, Daily Wisdom 20, Tao 20)', () => {
  it('no longer scores the eight practices or reflected actions', () => {
    const d = day();
    d.dharma = { satya: true, nyaya: true };
    d.actions = [{ text: 'helped', principle: 'Seva', alignment: 2 }];
    expect(soulScore(d)).toBeNull();
  });
  it('scores Daily Wisdom 20 and gratitude 7.5 each up to four', () => {
    const d = day();
    d.soul = { verseStudied: true, gratitude: ['family', 'health', 'rain', 'tea', 'books'] };
    const s = soulScore(d)!;
    expect([s.verse, s.gratitude, s.total]).toEqual([20, 30, 50]);
  });
  it('scores the Tao practice 20 on any day', () => {
    const d = emptyDay('2026-10-21');
    d.tao = { done: true };
    expect(soulScore(d)!.tao).toBe(20);
    expect(mindScore(d, P)).toBeNull();
  });
  it('skips empty gratitude boxes instead of crashing', () => {
    const d = { ...emptyDay('2026-10-23'), soul: { gratitude: [null, null, 'My family'] as unknown as string[] } };
    expect(soulScore(d)!.gratitude).toBe(7.5);
  });
  it('scores love: whom 12, myself 12, done 6; everything done is exactly 100', () => {
    const d = { ...emptyDay('2026-10-24'), love: { whom: 'Talk to a friend', self: 'A coffee or a treat', done: true } };
    expect(soulScore(d)!.love).toBe(30);
    const full = { ...d, tao: { done: true }, soul: { gratitude: ['a', 'b', 'c', 'd'], verseStudied: true } };
    expect(soulScore(full)!.total).toBe(100);
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


describe('phone activity groups (26 Oct 2026)', () => {
  it('learning and AI tools raise quality without using up the limit; tools and "Not me" are not scored', () => {
    const d = emptyDay('2026-10-26');
    d.media = [
      { platform: 'Other', app: 'Claude', minutes: 55, category: 'learning', group: 'learning', source: 'screen' },
      { platform: 'WhatsApp', minutes: 40, category: 'connect', group: 'social', source: 'screen' },
      { platform: 'YouTube', minutes: 409, category: 'fun', group: 'social', source: 'screen', notMe: true },
      { platform: 'Other', app: 'Google Pay', minutes: 15, category: 'news', group: 'tool', source: 'screen' },
    ];
    const m = mindScore(d, P)!;
    expect(m.minutes).toBe(95);
    // 40 social minutes is within the 60-minute limit: full 12 for quantity.
    expect(m.content).toBeCloseTo(18 * ((55 * 1 + 40 * 0.8) / 95) + 12, 5);
  });
});
