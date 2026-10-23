// Apple Health on iPhone (and through it, Apple Watch and apps such as Withings that share into Health).
// Read-only; Happy Orange never writes to Apple Health. The web and Android builds use src/lib/health.ts instead.
// 20 Oct 2026 (founder): besides steps, exercise minutes and sleep, also weight and body fat, resting heart rate,
// heart rate variability, cardio fitness (VO2 max), active energy, mindful minutes, workouts and sleep stages.

import {
  getMostRecentQuantitySample,
  isHealthDataAvailable,
  queryCategorySamples,
  queryStatisticsForQuantity,
  queryWorkoutSamples,
  requestAuthorization,
  WorkoutActivityType,
} from '@kingstinct/react-native-healthkit';
import type { HealthDay } from './health';

export type { HealthDay } from './health';

const READ = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierAppleExerciseTime',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierBodyFatPercentage',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierVO2Max',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKCategoryTypeIdentifierMindfulSession',
  'HKWorkoutTypeIdentifier',
] as const;

/** Bump when READ grows, so people who connected earlier see Apple's sheet once more for the new items. */
export const HEALTH_READ_VERSION = 2;

export const healthAvailable = (): boolean => {
  try { return isHealthDataAvailable(); } catch { return false; }
};

/** Shows Apple's permission sheet (only for items not asked before). Returns true if the sheet was handled. */
export async function connectHealth(): Promise<boolean> {
  if (!healthAvailable()) return false;
  return requestAuthorization({ toRead: READ } as never);
}

const DAY = 24 * 3600 * 1000;
const dayStart = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const r1 = (n: number) => Math.round(n * 10) / 10;
const range = (start: Date, end: Date) => ({ filter: { date: { startDate: start, endDate: end } } });

async function stat(id: string, kind: 'cumulativeSum' | 'discreteAverage', unit: string, start: Date, end: Date) {
  const r = await queryStatisticsForQuantity(id as never, [kind], { ...range(start, end), unit } as never);
  return kind === 'cumulativeSum' ? r.sumQuantity?.quantity : r.averageQuantity?.quantity;
}

/** The latest reading, if it is recent enough to still describe the person. */
async function latest(id: string, unit: string, maxAgeDays: number, end: Date) {
  return (await latestAt(id, unit, maxAgeDays, end))?.value;
}
async function latestAt(id: string, unit: string, maxAgeDays: number, end: Date) {
  const s = await getMostRecentQuantitySample(id as never, unit as never);
  if (!s) return undefined;
  const at = new Date(s.endDate as unknown as string).getTime();
  return at <= end.getTime() && end.getTime() - at <= maxAgeDays * DAY ? { value: s.quantity, at } : undefined;
}

/** The night ending on this date (6 pm the evening before until noon). Watch and phone can both record the same
 *  night, so each source is added up on its own and the source with the most sleep is used. */
async function sleepOf(iso: string) {
  const start = new Date(dayStart(iso).getTime() - 6 * 3600 * 1000);
  const end = new Date(dayStart(iso).getTime() + 12 * 3600 * 1000);
  const samples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', { limit: 0, ...range(start, end) } as never);
  // 0 in bed, 1 asleep (unspecified), 2 awake, 3 core, 4 deep, 5 REM
  const bySource: Record<string, { asleep: number; deep: number; core: number; rem: number; awake: number }> = {};
  for (const s of samples) {
    const v = Number(s.value);
    const ms = new Date(s.endDate as unknown as string).getTime() - new Date(s.startDate as unknown as string).getTime();
    const key = s.sourceRevision?.source?.bundleIdentifier ?? 'unknown';
    const b = (bySource[key] ??= { asleep: 0, deep: 0, core: 0, rem: 0, awake: 0 });
    if (v === 2) b.awake += ms;
    if (v === 1 || v >= 3) b.asleep += ms;
    if (v === 3) b.core += ms;
    if (v === 4) b.deep += ms;
    if (v === 5) b.rem += ms;
  }
  const best = Object.values(bySource).sort((a, b) => b.asleep - a.asleep)[0];
  if (!best || best.asleep <= 0) return { hours: undefined, stages: undefined };
  const h = (ms: number) => (ms > 0 ? r1(ms / 3600000) : undefined);
  const staged = best.deep + best.core + best.rem > 0;
  return { hours: h(best.asleep), stages: staged ? { deep: h(best.deep), core: h(best.core), rem: h(best.rem), awake: h(best.awake) } : undefined };
}

async function mindfulMinutes(start: Date, end: Date) {
  const samples = await queryCategorySamples('HKCategoryTypeIdentifierMindfulSession', { limit: 0, ...range(start, end) } as never);
  const ms = samples.reduce((t, s) => t + (new Date(s.endDate as unknown as string).getTime() - new Date(s.startDate as unknown as string).getTime()), 0);
  return ms > 0 ? Math.round(ms / 60000) : undefined;
}

const WORKOUT_NAMES: Record<string, string> = {
  walking: 'Walk', running: 'Run', cycling: 'Cycling', yoga: 'Yoga', swimming: 'Swim', hiking: 'Hike',
  traditionalStrengthTraining: 'Strength', functionalStrengthTraining: 'Strength', highIntensityIntervalTraining: 'HIIT',
  mindAndBody: 'Mind and body', pilates: 'Pilates', dance: 'Dance', cricket: 'Cricket', badminton: 'Badminton',
  tennis: 'Tennis', soccer: 'Football', elliptical: 'Elliptical', rowing: 'Rowing', stairClimbing: 'Stairs',
  coreTraining: 'Core', flexibility: 'Stretching', cooldown: 'Cool-down',
};

async function workoutsOf(start: Date, end: Date) {
  const list = await queryWorkoutSamples({ limit: 0, ...range(start, end) } as never);
  const out = list.map(w => {
    const raw = (WorkoutActivityType as unknown as Record<number, string>)[w.workoutActivityType as unknown as number] ?? 'other';
    const d = w.duration as unknown as { quantity: number; unit: string } | number;
    const secs = typeof d === 'number' ? d : d.unit === 'min' ? d.quantity * 60 : d.unit === 'hr' ? d.quantity * 3600 : d.quantity;
    const e = w.totalEnergyBurned;
    const kcal = e ? (e.unit === 'kJ' ? e.quantity / 4.184 : e.quantity) : undefined;
    return { type: WORKOUT_NAMES[raw] ?? 'Workout', min: Math.round(secs / 60), kcal: kcal != null ? Math.round(kcal) : undefined };
  }).filter(w => w.min > 0);
  return out.length ? out : undefined;
}

const safe = <T,>(p: Promise<T>) => p.catch(() => undefined);

/** One day's numbers from Apple Health (undefined where Health has nothing or permission was not given). */
export async function readHealthDay(iso: string): Promise<HealthDay> {
  const start = dayStart(iso), end = new Date(start.getTime() + DAY);
  const now = new Date(Math.min(Date.now(), end.getTime()));
  const [steps, activeMin, activeKcal, sleep, weight, fat, rhr, hrv, vo2, mindful, workouts] = await Promise.all([
    safe(stat('HKQuantityTypeIdentifierStepCount', 'cumulativeSum', 'count', start, end)),
    safe(stat('HKQuantityTypeIdentifierAppleExerciseTime', 'cumulativeSum', 'min', start, end)),
    safe(stat('HKQuantityTypeIdentifierActiveEnergyBurned', 'cumulativeSum', 'kcal', start, end)),
    safe(sleepOf(iso)),
    safe(latestAt('HKQuantityTypeIdentifierBodyMass', 'kg', 30, now)),
    safe(latest('HKQuantityTypeIdentifierBodyFatPercentage', '%', 30, now)),
    safe(latest('HKQuantityTypeIdentifierRestingHeartRate', 'count/min', 2, now)),
    // Heart rate variability: average over the last 24 hours (the watch measures it a few times a day and at night).
    safe(stat('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', 'discreteAverage', 'ms', new Date(now.getTime() - DAY), now)),
    safe(latest('HKQuantityTypeIdentifierVO2Max', 'ml/(kg*min)', 60, now)),
    safe(mindfulMinutes(start, end)),
    safe(workoutsOf(start, end)),
  ]);
  return {
    steps: steps != null ? Math.round(steps) : undefined,
    activeMin: activeMin != null ? Math.round(activeMin) : undefined,
    sleepHours: sleep?.hours,
    sleepStages: sleep?.stages,
    activeKcal: activeKcal != null ? Math.round(activeKcal) : undefined,
    weightKg: weight != null ? r1(weight.value) : undefined,
    weightAt: weight?.at,
    bodyFatPct: fat != null ? r1(fat <= 1 ? fat * 100 : fat) : undefined,
    restingHr: rhr != null ? Math.round(rhr) : undefined,
    hrv: hrv != null ? Math.round(hrv) : undefined,
    vo2max: vo2 != null ? r1(vo2) : undefined,
    mindfulMin: mindful,
    workouts,
  };
}
