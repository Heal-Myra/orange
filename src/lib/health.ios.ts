// Apple Health on iPhone (and through it, Apple Watch): read today's steps, exercise minutes and last night's sleep.
// Read-only; Happy Orange never writes to Apple Health. The web and Android builds use src/lib/health.ts instead.

import {
  isHealthDataAvailable,
  queryCategorySamples,
  queryStatisticsForQuantity,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';
import type { HealthDay } from './health';

export type { HealthDay } from './health';

const READ = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierAppleExerciseTime',
  'HKCategoryTypeIdentifierSleepAnalysis',
] as const;

export const healthAvailable = (): boolean => {
  try { return isHealthDataAvailable(); } catch { return false; }
};

/** Shows Apple's permission sheet (only the first time). Returns true if the sheet was handled. */
export async function connectHealth(): Promise<boolean> {
  if (!healthAvailable()) return false;
  return requestAuthorization({ toRead: READ });
}

const dayStart = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };

async function sum(id: 'HKQuantityTypeIdentifierStepCount' | 'HKQuantityTypeIdentifierAppleExerciseTime', unit: string, start: Date, end: Date) {
  const r = await queryStatisticsForQuantity(id, ['cumulativeSum'], { filter: { date: { startDate: start, endDate: end } }, unit } as never);
  return r.sumQuantity?.quantity;
}

/** Hours asleep for the night ending on this date (6 pm the evening before until noon). Watch and phone can both
 *  record the same night, so each source is added up on its own and the largest one is used. */
async function sleepHours(iso: string): Promise<number | undefined> {
  const start = new Date(dayStart(iso).getTime() - 6 * 3600 * 1000);
  const end = new Date(dayStart(iso).getTime() + 12 * 3600 * 1000);
  const samples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', { limit: 0, filter: { date: { startDate: start, endDate: end } } });
  const bySource: Record<string, number> = {};
  for (const s of samples) {
    const v = Number(s.value);
    if (v === 0 || v === 2) continue; // in bed, awake
    const key = s.sourceRevision?.source?.bundleIdentifier ?? 'unknown';
    bySource[key] = (bySource[key] ?? 0) + (new Date(s.endDate).getTime() - new Date(s.startDate).getTime());
  }
  const best = Math.max(0, ...Object.values(bySource));
  return best > 0 ? Math.round((best / 3600000) * 10) / 10 : undefined;
}

/** Today's numbers from Apple Health (undefined where Health has nothing). */
export async function readHealthDay(iso: string): Promise<HealthDay> {
  const start = dayStart(iso), end = new Date(start.getTime() + 24 * 3600 * 1000);
  const [steps, activeMin, sleep] = await Promise.all([
    sum('HKQuantityTypeIdentifierStepCount', 'count', start, end).catch(() => undefined),
    sum('HKQuantityTypeIdentifierAppleExerciseTime', 'min', start, end).catch(() => undefined),
    sleepHours(iso).catch(() => undefined),
  ]);
  return {
    steps: steps != null ? Math.round(steps) : undefined,
    activeMin: activeMin != null ? Math.round(activeMin) : undefined,
    sleepHours: sleep,
  };
}
