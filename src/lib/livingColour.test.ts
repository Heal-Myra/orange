import { describe, expect, it } from 'vitest';
import { mix, sectionOf, skyFor } from './livingColour';

describe('living colour (decision 0065)', () => {
  it('mixes colours', () => { expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080'); expect(mix('#000000', '#FFFFFF', 2)).toBe('#ffffff'); });
  it('Body grows stronger, Mind lighter, Soul spreads, Spaces clears with the score', () => {
    const lum = (h: string) => parseInt(h.slice(1, 3), 16) + parseInt(h.slice(3, 5), 16) + parseInt(h.slice(5, 7), 16);
    expect(lum(skyFor('body', 90).stops[0])).toBeLessThan(lum(skyFor('body', 10).stops[0]));
    expect(lum(skyFor('mind', 90).stops[0])).toBeGreaterThan(lum(skyFor('mind', 10).stops[0]));
    expect(skyFor('mind', 10).glows.length).toBeGreaterThan(skyFor('mind', 95).glows.length);
    expect(skyFor('soul', 90).glows[0].r).toBeGreaterThan(skyFor('soul', 10).glows[0].r);
    expect(skyFor('spaces', 95).glows[0].opacity).toBeLessThan(skyFor('spaces', 10).glows[0].opacity);
    expect(skyFor('today', 90).glows[1].cy).toBeLessThan(skyFor('today', 10).glows[1].cy); // the sun rises
  });
  it('knows each route', () => { expect(sectionOf('/mind')).toBe('mind'); expect(sectionOf('/spaces')).toBe('spaces'); expect(sectionOf('/')).toBe('today'); expect(sectionOf('/trend')).toBe('today'); });
});
