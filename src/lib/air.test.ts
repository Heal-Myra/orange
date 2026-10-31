import { describe, expect, it } from 'vitest';
import { airCat, airLine, indianAqi, last24 } from './air';

describe('Indian AQI (CPCB)', () => {
  it('takes the higher of the PM2.5 and PM10 sub-indices', () => {
    expect(indianAqi(20, 40)).toBe(40); // PM10 40 → 40; PM2.5 20 → 33
    expect(indianAqi(30, 10)).toBe(50);
    expect(indianAqi(75, 120)).toBe(149); // PM2.5 75 → 101 + 99/29 × 14 ≈ 149; PM10 120 → 114
    expect(indianAqi(110, 200)).toBeGreaterThan(200);
    expect(indianAqi(600, 900)).toBe(500);
  });
  it('names the category', () => {
    expect(airCat(42)).toBe('good');
    expect(airCat(100)).toBe('satisfactory');
    expect(airCat(182)).toBe('moderate');
    expect(airCat(250)).toBe('poor');
    expect(airCat(350)).toBe('veryPoor');
    expect(airCat(480)).toBe('severe');
  });
  it('averages the last 24 hours only', () => {
    const now = Date.parse('2026-10-31T10:00:00Z');
    const times = Array.from({ length: 48 }, (_, i) => new Date(now - (36 - i) * 3600_000).toISOString());
    const vals = times.map((t, i) => (Date.parse(t) > now ? 999 : i < 12 ? 500 : 100));
    expect(last24(times, vals, now)).toBe(100);
    expect(last24(times.slice(0, 3), [1, 2, 3], now)).toBeNull();
  });
  it('tells Myra to move indoors on a poor day', () => {
    expect(airLine({ aqi: 250, cat: 'poor', pm25: 105, pm10: 220, place: 'Delhi', at: 'x' })).toContain('indoors');
    expect(airLine({ aqi: 40, cat: 'good', pm25: 10, pm10: 30, at: 'x' })).not.toContain('Fit suggestions');
  });
});
