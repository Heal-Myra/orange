// Cool room for deep sleep (founder, 16 Nov 2026; idea 10): after two weeks of nights, compare deep sleep on cooler and
// warmer nights, from the ring's or Watch's night temperature (or, without one, the person's own "how was the room"
// tap). One tip for tonight. No medical claims.

import type { DayLog } from './types';
import { shiftISO } from './dates';

export const NEED = 10; // nights with both numbers before anything is said

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r1 = (n: number) => Math.round(n * 10) / 10;

export function coolRoom(days: Record<string, DayLog>, today: string, look = 42): null | {
  by: 'temp' | 'feel'; cool: number; warm: number; nights: number; lastTemp?: number; usual?: number; line: [string, Record<string, number>?];
} {
  const keys = Object.keys(days).filter(k => k <= today && k > shiftISO(today, -look)).sort();
  const t = keys.map(k => ({ k, deep: days[k]?.health?.sleepStages?.deep, temp: days[k]?.health?.nightTempC })).filter(x => x.deep != null && x.temp != null) as { k: string; deep: number; temp: number }[];
  if (t.length >= NEED) {
    const sorted = [...t].sort((a, b) => a.temp - b.temp), half = Math.floor(sorted.length / 2);
    const cool = avg(sorted.slice(0, half).map(x => x.deep)), warm = avg(sorted.slice(-half).map(x => x.deep));
    const usual = avg(t.map(x => x.temp)), last = t[t.length - 1];
    return { by: 'temp', cool: r1(cool), warm: r1(warm), nights: t.length, lastTemp: last.temp, usual: Math.round(usual * 100) / 100, line: tip(cool, warm, last.temp - usual) };
  }
  const f = keys.map(k => ({ deep: days[k]?.health?.sleepStages?.deep, room: days[k]?.sleep.room })).filter(x => x.deep != null && x.room) as { deep: number; room: 'warm' | 'ok' | 'cold' }[];
  const cool = f.filter(x => x.room !== 'warm').map(x => x.deep), warm = f.filter(x => x.room === 'warm').map(x => x.deep);
  if (f.length >= NEED && cool.length >= 3 && warm.length >= 3) return { by: 'feel', cool: r1(avg(cool)), warm: r1(avg(warm)), nights: f.length, line: tip(avg(cool), avg(warm), 0) };
  return null;
}

function tip(cool: number, warm: number, lastAboveUsual: number): [string, Record<string, number>?] {
  if (cool - warm >= 0.2) return lastAboveUsual > 0.2 ? ['Room a little cooler tonight: fan up, AC at 25°.'] : ['Cooler nights give you deeper sleep. Keep it so.'];
  if (warm - cool >= 0.2) return ['A cosy room suits your sleep. Keep it warm.'];
  return ['Room temperature makes little difference for you.'];
}
