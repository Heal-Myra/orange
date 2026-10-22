import { describe, expect, it } from 'vitest';
import { momentOf, type RoutineItem } from './routine';

const day: RoutineItem[] = [
  { at: '05:30', what: 'Tea and plan the day', kind: 'wake' },
  { at: '06:00', what: 'Walk and exercise', kind: 'exercise' },
  { at: '09:00', what: 'Reach office', kind: 'work', days: 'weekdays' },
  { at: '11:00', what: 'Tea break', kind: 'break', days: 'weekdays' },
  { at: '13:00', what: 'Lunch', kind: 'meal' },
  { at: '21:30', what: 'Sleep', kind: 'sleep' },
];
const at = (h: number, m: number, weekday = true) => new Date(2026, 9, weekday ? 22 : 24, h, m); // Thu 22 / Sat 24 Oct

describe('usual day', () => {
  it('switches five minutes before the activity', () => {
    expect(momentOf(day, at(10, 54))!.now.what).toBe('Reach office');
    expect(momentOf(day, at(10, 55))!.now.what).toBe('Tea break');
  });
  it('knows what comes next', () => {
    expect(momentOf(day, at(11, 30))!.next!.what).toBe('Lunch');
  });
  it('before the first item it is still night', () => {
    expect(momentOf(day, at(4, 0))!.now.kind).toBe('sleep');
  });
  it('skips weekday-only items at the weekend', () => {
    expect(momentOf(day, at(11, 30, false))!.now.what).toBe('Walk and exercise');
  });
  it('returns null without a routine', () => {
    expect(momentOf(undefined, at(9, 0))).toBeNull();
  });
});
