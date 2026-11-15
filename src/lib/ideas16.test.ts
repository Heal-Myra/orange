import { describe, expect, it } from 'vitest';
import { nextTime, runLadder, nextValue, paceText } from './ladder';
import { cadenceCoach } from './cadence';
import { lastTwo, testDue, fitnessLine } from './fitnessTest';
import { focusScore, focusDue, focusLine, makeRound } from './focusGame';
import { coolRoom } from './coolRoom';
import { prakritiOf } from './prakriti';
import { dinnerAt, walkMinutes, nudgeNow } from './dinnerWalk';
import { bodyScore, soulScore } from './scoring';
import { DEFAULT_PROFILE, emptyDay, type DayLog } from './types';

describe('personal-best ladder', () => {
  it('next rung is a small step faster, on a 10-second mark', () => {
    expect(nextTime(27 * 60 + 23)).toBe(26 * 60 + 50);
    expect(nextTime(42 * 60 + 26)).toBe(41 * 60 + 40);
  });
  it('reached bests in order, newest first', () => {
    const l = runLadder([{ at: '2026-11-02', km: 5, secs: 28 * 60 + 10 }, { at: '2026-11-08', km: 5.2, secs: 30 * 60 }, { at: '2026-11-14', km: 5, secs: 27 * 60 + 23 }], 5)!;
    expect(l.best).toBe(27 * 60 + 23);
    expect(l.reached.map(r => r.at)).toEqual(['2026-11-14', '2026-11-02']);
    expect(paceText(l.pace)).toBe('5:22');
  });
  it('a little more for other bests', () => {
    expect(nextValue({ kind: 'day', value: 15230 })).toBe(16000);
    expect(nextValue({ kind: 'streak', value: 8 })).toBe(10);
    expect(nextValue({ kind: 'day', value: 7 })).toBe(8);
  });
});

describe('cadence coach', () => {
  it('aims a little quicker when below the easy range', () => {
    const c = cadenceCoach([{ at: '2026-11-15', km: 5, secs: 1643, steps: 4327 }], '2026-11-16')!;
    expect(c.cadence).toBe(158);
    expect(c.aim).toBe(163);
  });
  it('quiet when the last run is old or has no steps', () => {
    expect(cadenceCoach([{ at: '2026-11-01', km: 5, secs: 1643, steps: 4327 }], '2026-11-16')).toBeNull();
    expect(cadenceCoach([{ at: '2026-11-16', km: 5, secs: 1643 }], '2026-11-16')).toBeNull();
  });
});

describe('fitness test', () => {
  it('due on the 1st to 3rd until taken', () => {
    expect(testDue([], '2026-12-01')).toBe(true);
    expect(testDue([{ date: '2026-12-01', pushups: 20 }], '2026-12-02')).toBe(false);
    expect(testDue([], '2026-12-05')).toBe(false);
  });
  it('counts new bests', () => {
    const r = lastTwo([{ date: '2026-11-01', pushups: 18, plank: 65 }, { date: '2026-12-01', pushups: 22, plank: 80 }]);
    expect(r.bests).toEqual(['pushups', 'plank']);
    expect(fitnessLine(2, false)[0]).toContain('new bests');
  });
});

describe('focus check', () => {
  it('scores 0-100', () => {
    expect(focusScore(25, 25, 50, 0, 300)).toBe(100);
    expect(focusScore(25, 0, 50, 50, null)).toBe(0);
  });
  it('a round fills 2 minutes with a third orange', () => {
    const r = makeRound(42);
    expect(r.length).toBeGreaterThan(55);
    expect(r.filter(x => x.orange).length).toBeGreaterThan(10);
  });
  it('weekly', () => {
    expect(focusDue([{ date: '2026-11-10', score: 70 }], '2026-11-16')).toBe(false);
    expect(focusDue([{ date: '2026-11-09', score: 70 }], '2026-11-16')).toBe(true);
    expect(focusLine([{ date: '2026-11-01', score: 70 }, { date: '2026-11-09', score: 80 }])[0]).toContain('New best');
  });
});

describe('cool room', () => {
  it('cooler nights with more deep sleep give the tip', () => {
    const days: Record<string, DayLog> = {};
    for (let i = 1; i <= 12; i++) {
      const k = `2026-11-${String(i).padStart(2, '0')}`;
      const cool = i % 2 === 0;
      days[k] = { ...emptyDay(k), health: { nightTempC: cool ? 35.8 : 36.4, sleepStages: { deep: cool ? 2.4 : 1.7 } } };
    }
    const r = coolRoom(days, '2026-11-12')!;
    expect(r.by).toBe('temp');
    expect(r.cool).toBe(2.4);
    expect(r.warm).toBe(1.7);
  });
  it('nothing before enough nights', () => expect(coolRoom({}, '2026-11-12')).toBeNull());
});

describe('prakriti', () => {
  it('one or two doshas', () => {
    expect(prakritiOf([1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2, 2]).result).toBe('Pitta');
    expect(prakritiOf([1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 2]).result).toBe('Pitta–Vata');
  });
});

describe('walk after dinner', () => {
  it('finds dinner and minutes', () => {
    expect(dinnerAt([{ name: 'a', kcal: 1, p: 0, c: 0, f: 0, source: 'photo' as never, at: '2026-11-16T20:10:00' }])?.getHours()).toBe(20);
    expect(walkMinutes(1240)).toBe(12);
    expect(walkMinutes(200)).toBe(0);
    expect(nudgeNow(new Date('2026-11-16T20:00:00'), 0, new Date('2026-11-16T20:20:00'))).toBe(true);
    expect(nudgeNow(new Date('2026-11-16T20:00:00'), 12, new Date('2026-11-16T20:20:00'))).toBe(false);
  });
  it('adds 2 to Movement from 16 Nov, capped at 30', () => {
    const d = { ...emptyDay('2026-11-16'), activity: { steps: 5000, activeMin: 15, dinnerWalk: 12 } };
    const P = { ...DEFAULT_PROFILE, steps: 10000, active: 30 };
    expect(bodyScore(d, P)!.movement).toBeCloseTo(17);
    expect(bodyScore({ ...d, activity: { steps: 20000, activeMin: 60, dinnerWalk: 12 } }, P)!.movement).toBe(30);
  });
  it('forgiveness adds 5 to Soul', () => {
    expect(soulScore({ ...emptyDay('2026-11-16'), soul: { forgave: true } })!.total).toBe(5);
  });
});
