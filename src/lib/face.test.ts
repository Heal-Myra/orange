import { describe, expect, it } from 'vitest';
import { cleanReading, earlierReading, faceLine, skinChange } from './face';

describe('Face & beauty', () => {
  it('keeps only known skin points, levels and safe hints', () => {
    const r = cleanReading({ skin: { dryness: 'mild', acne: 'severe', tan: 'very', lips: 'none' } as never, looks: 'sad' as never, hints: ['tired', 'stressed', 'cold'] as never,
      witty: 'Sunny and rested and happy today', tips: ['Drink water', '', 'Sunscreen', 'Aloe', 'Sleep'] }, 'x');
    expect(r.skin).toEqual({ dryness: 'mild', lips: 'none' });
    expect(r.looks).toBeNull();
    expect(r.hints).toEqual(['tired']);
    expect(r.witty).toBe('Sunny and rested and');
    expect(r.tips).toEqual(['Drink water', 'Sunscreen', 'Aloe']);
  });
  it('compares with an earlier reading', () => {
    expect(skinChange('none', 'mild')).toBe('better');
    expect(skinChange('noticeable', 'mild')).toBe('worse');
    expect(skinChange('mild', 'mild')).toBe('same');
    expect(skinChange('mild', undefined)).toBeNull();
  });
  it('finds the last reading within 30 days', () => {
    const f = cleanReading({ witty: 'Fresh' }, 'x');
    const days = { '2026-09-01': { face: f }, '2026-10-20': { face: f }, '2026-10-29': {}, '2026-10-31': { face: f } };
    expect(earlierReading(days, '2026-10-31')?.date).toBe('2026-10-20');
    expect(earlierReading({ '2026-09-01': { face: f } }, '2026-10-31')).toBeNull();
  });
  it('tells Myra only skin care, never a diagnosis', () => {
    const line = faceLine(cleanReading({ skin: { darkCircles: 'mild', dryness: 'none' }, looksNote: 'a little tired' }, 'x'));
    expect(line).toContain('darkCircles mild');
    expect(line).not.toContain('dryness');
    expect(line).toContain('not a diagnosis');
  });
});
