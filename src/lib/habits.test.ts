import { describe, expect, it } from 'vitest';
import { habitNow, readHabit, type Habit } from './habits';

describe('habits', () => {
  it('reads the repeat and time from the words', () => {
    expect(readHabit('Call Dad daily at 9 AM')).toEqual({ repeat: 'daily', at: '09:00' });
    expect(readHabit('Call Babuji jio daily at 0900 AM')).toEqual({ repeat: 'daily', at: '09:00' });
    expect(readHabit('Gym every Monday 6:30 pm')).toEqual({ repeat: 'weekly', weekday: 1, at: '18:30' });
    expect(readHabit('Stand-up weekdays 10:00')).toEqual({ repeat: 'weekdays', at: '10:00' });
    expect(readHabit('Buy milk')).toEqual({});
  });
  it('shows a habit from five minutes before its time, until done', () => {
    const h: Habit = { id: 'h', title: 'Call Dad', area: 'family', repeat: 'daily', at: '09:00', createdAt: '2026-10-23T00:00:00Z' };
    const at = (hh: number, mm: number) => new Date(2026, 9, 23, hh, mm);
    expect(habitNow([h], [], at(8, 54))).toBeNull();
    expect(habitNow([h], [], at(8, 55))?.id).toBe('h');
    expect(habitNow([h], ['h'], at(9, 5))).toBeNull();
    expect(habitNow([h], [], at(10, 30))).toBeNull();
  });
});

describe('habit names', () => {
  it('drop the repeat and time words', async () => {
    const { habitTitle } = await import('./habits');
    expect(habitTitle('Call Dad daily at 9 AM')).toBe('Call Dad');
    expect(habitTitle('Call Babuji jio daily at 0900 AM')).toBe('Call Babuji jio');
    expect(habitTitle('Gym every Monday 6:30 pm')).toBe('Gym');
  });
});
