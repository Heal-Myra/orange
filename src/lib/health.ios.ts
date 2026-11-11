// Apple Health on iPhone (and through it, Apple Watch and apps such as Withings that share into Health).
// Read-only; Happy Orange never writes to Apple Health. The web and Android builds use src/lib/health.ts instead.
// 20 Oct 2026 (founder): besides steps, exercise minutes and sleep, also weight and body fat, resting heart rate,
// heart rate variability, cardio fitness (VO2 max), active energy, mindful minutes, workouts and sleep stages.

import {
  getMostRecentQuantitySample,
  isHealthDataAvailable,
  queryCategorySamples,
  queryStatisticsCollectionForQuantity,
  queryStatisticsForQuantity,
  queryWorkoutSamples,
  requestAuthorization,
  WorkoutActivityType,
} from '@kingstinct/react-native-healthkit';
import type { HealthDay, Run } from './health';

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
export const HEALTH_READ_VERSION = 3; // 3: everything for the health vault (11 Nov 2026)

export const healthAvailable = (): boolean => {
  try { return isHealthDataAvailable(); } catch { return false; }
};

/** Shows Apple's permission sheet (only for items not asked before). Returns true if the sheet was handled. */
export async function connectHealth(): Promise<boolean> {
  if (!healthAvailable()) return false;
  return requestAuthorization({ toRead: [...new Set([...READ, ...VAULT_READ])] } as never);
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
  const bySource: Record<string, { asleep: number; deep: number; core: number; rem: number; awake: number; bed?: number }> = {};
  for (const s of samples) {
    const v = Number(s.value);
    const ms = new Date(s.endDate as unknown as string).getTime() - new Date(s.startDate as unknown as string).getTime();
    const key = s.sourceRevision?.source?.bundleIdentifier ?? 'unknown';
    const b = (bySource[key] ??= { asleep: 0, deep: 0, core: 0, rem: 0, awake: 0 });
    if (v === 2) b.awake += ms;
    if (v === 1 || v >= 3) { b.asleep += ms; const t0 = new Date(s.startDate as unknown as string).getTime(); if (!b.bed || t0 < b.bed) b.bed = t0; } // first fell asleep
    if (v === 3) b.core += ms;
    if (v === 4) b.deep += ms;
    if (v === 5) b.rem += ms;
  }
  const best = Object.values(bySource).sort((a, b) => b.asleep - a.asleep)[0];
  if (!best || best.asleep <= 0) return { hours: undefined, stages: undefined };
  const h = (ms: number) => (ms > 0 ? r1(ms / 3600000) : undefined);
  const staged = best.deep + best.core + best.rem > 0;
  return { hours: h(best.asleep), bed: best.bed ? new Date(best.bed).toISOString() : undefined, stages: staged ? { deep: h(best.deep), core: h(best.core), rem: h(best.rem), awake: h(best.awake) } : undefined };
}

async function mindfulMinutes(start: Date, end: Date) {
  const samples = await queryCategorySamples('HKCategoryTypeIdentifierMindfulSession', { limit: 0, ...range(start, end) } as never);
  // Two apps (or the Watch and an app) can log the same minutes: count overlapping time once (5 Nov 2026).
  const spans = samples.map(s => [new Date(s.startDate as unknown as string).getTime(), new Date(s.endDate as unknown as string).getTime()] as const)
    .filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  let ms = 0, upTo = -Infinity;
  for (const [a, b] of spans) { if (b <= upTo) continue; ms += b - Math.max(a, upTo); upTo = b; }
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
    sleepBed: sleep?.bed,
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

/** Every run of the last 5 years with its distance and time (founder, 11 Nov 2026: Top of My Game missed the Watch's
 *  "fastest 5 km"). Read straight from Apple Health, so runs from before Happy Orange count too. */
export async function readRuns(): Promise<Run[]> {
  const end = new Date(), start = new Date(end.getTime() - 5 * 365 * DAY);
  const list = await queryWorkoutSamples({ limit: 0, ...range(start, end) } as never).catch(() => []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return list.flatMap(w => {
    const raw = (WorkoutActivityType as unknown as Record<number, string>)[w.workoutActivityType as unknown as number] ?? '';
    if (raw !== 'running') return [];
    const dist = (w as unknown as { totalDistance?: { quantity: number; unit: string } }).totalDistance;
    if (!dist) return [];
    const km = dist.unit === 'km' ? dist.quantity : dist.unit === 'mi' ? dist.quantity * 1.609344 : dist.quantity / 1000;
    const d = w.duration as unknown as { quantity: number; unit: string } | number;
    const secs = typeof d === 'number' ? d : d.unit === 'min' ? d.quantity * 60 : d.unit === 'hr' ? d.quantity * 3600 : d.quantity;
    const t = new Date(w.startDate);
    return km > 0.5 && secs > 60 ? [{ at: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`, km, secs }] : [];
  });
}

// ---- The health vault (founder, 11 Nov 2026): everything Apple Health has, kept for the future learning engine ----
// Every quantity Apple Health offers (from the Watch, phone, scales, Oura, Whoop, Garmin … through Health), as daily
// figures, plus every workout and every event (sleep stages, mindful sessions, stand hours, heart alerts). Reproductive
// health is not read. Units are fixed per metric so the numbers always mean the same thing.
type M = [id: string, unit: string, sum?: true];
export const VAULT_METRICS: M[] = [
  ['StepCount', 'count', true], ['DistanceWalkingRunning', 'km', true], ['DistanceCycling', 'km', true], ['DistanceSwimming', 'm', true],
  ['FlightsClimbed', 'count', true], ['ActiveEnergyBurned', 'kcal', true], ['BasalEnergyBurned', 'kcal', true],
  ['AppleExerciseTime', 'min', true], ['AppleStandTime', 'min', true], ['AppleMoveTime', 'min', true], ['TimeInDaylight', 'min', true],
  ['SwimmingStrokeCount', 'count', true], ['NumberOfTimesFallen', 'count', true],
  ['DietaryWater', 'mL', true], ['DietaryEnergyConsumed', 'kcal', true], ['DietaryProtein', 'g', true], ['DietaryCarbohydrates', 'g', true],
  ['DietaryFatTotal', 'g', true], ['DietaryFiber', 'g', true], ['DietarySugar', 'g', true], ['DietarySodium', 'mg', true], ['DietaryCaffeine', 'mg', true],
  ['HeartRate', 'count/min'], ['RestingHeartRate', 'count/min'], ['WalkingHeartRateAverage', 'count/min'],
  ['HeartRateVariabilitySDNN', 'ms'], ['HeartRateRecoveryOneMinute', 'count/min'], ['VO2Max', 'ml/(kg*min)'],
  ['RespiratoryRate', 'count/min'], ['OxygenSaturation', '%'], ['BodyTemperature', 'degC'], ['AppleSleepingWristTemperature', 'degC'],
  ['BodyMass', 'kg'], ['BodyMassIndex', 'count'], ['BodyFatPercentage', '%'], ['LeanBodyMass', 'kg'], ['WaistCircumference', 'cm'], ['Height', 'cm'],
  ['BloodPressureSystolic', 'mmHg'], ['BloodPressureDiastolic', 'mmHg'], ['BloodGlucose', 'mg/dL'],
  ['WalkingSpeed', 'm/s'], ['WalkingStepLength', 'cm'], ['WalkingAsymmetryPercentage', '%'], ['WalkingDoubleSupportPercentage', '%'],
  ['AppleWalkingSteadiness', '%'], ['SixMinuteWalkTestDistance', 'm'], ['StairAscentSpeed', 'm/s'], ['StairDescentSpeed', 'm/s'],
  ['RunningSpeed', 'm/s'], ['RunningPower', 'W'], ['RunningStrideLength', 'm'], ['RunningGroundContactTime', 'ms'], ['RunningVerticalOscillation', 'cm'],
  ['CyclingPower', 'W'], ['CyclingCadence', 'count/min'], ['CyclingSpeed', 'm/s'],
  ['EnvironmentalAudioExposure', 'dBASPL'], ['HeadphoneAudioExposure', 'dBASPL'],
];
export const VAULT_EVENTS = ['SleepAnalysis', 'MindfulSession', 'AppleStandHour', 'HighHeartRateEvent', 'LowHeartRateEvent', 'IrregularHeartRhythmEvent', 'LowCardioFitnessEvent'];
export const VAULT_READ = [
  ...VAULT_METRICS.map(([id]) => `HKQuantityTypeIdentifier${id}`),
  ...VAULT_EVENTS.map(id => `HKCategoryTypeIdentifier${id}`),
  'HKWorkoutTypeIdentifier',
];

const isoOf = (t: Date) => `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
const plain = (x: unknown) => { try { return x == null ? null : JSON.parse(JSON.stringify(x)); } catch { return null; } };

export interface VaultDaily { date: string; metric: string; unit: string; sum: number | null; avg: number | null; min: number | null; max: number | null }
export interface VaultWorkout { id: string; type: string; start_at: string; end_at: string; minutes: number; km: number | null; kcal: number | null; source: string | null; meta: unknown }
export interface VaultEvent { id: string; kind: string; value: number | null; start_at: string; end_at: string; source: string | null }

/** Daily figures for every metric between two dates (local days). */
export async function vaultDaily(from: string, to: string): Promise<VaultDaily[]> {
  const start = dayStart(from), end = new Date(dayStart(to).getTime() + DAY);
  const out: VaultDaily[] = [];
  for (const [id, unit, sum] of VAULT_METRICS) {
    const stats = sum ? ['cumulativeSum'] : ['discreteAverage', 'discreteMin', 'discreteMax'];
    const rows = await queryStatisticsCollectionForQuantity(`HKQuantityTypeIdentifier${id}` as never, stats as never, start, { day: 1 }, { ...range(start, end), unit } as never).catch(() => []);
    for (const r of rows) {
      const q = (x?: { quantity: number }) => (x && Number.isFinite(x.quantity) ? x.quantity : null);
      const row = { date: isoOf(new Date(r.startDate as unknown as string)), metric: id, unit, sum: q(r.sumQuantity), avg: q(r.averageQuantity), min: q(r.minimumQuantity), max: q(r.maximumQuantity) };
      if (row.sum != null || row.avg != null) out.push(row);
    }
  }
  return out;
}

/** Every workout between two dates, with what Apple Health knows about it. */
export async function vaultWorkouts(from: string, to: string): Promise<VaultWorkout[]> {
  const start = dayStart(from), end = new Date(dayStart(to).getTime() + DAY);
  const list = await queryWorkoutSamples({ limit: 0, ...range(start, end) } as never).catch(() => []);
  return list.map(w => {
    const raw = (WorkoutActivityType as unknown as Record<number, string>)[w.workoutActivityType as unknown as number] ?? String(w.workoutActivityType);
    const d = w.duration as unknown as { quantity: number; unit: string } | number;
    const secs = typeof d === 'number' ? d : d.unit === 'min' ? d.quantity * 60 : d.unit === 'hr' ? d.quantity * 3600 : d.quantity;
    const dist = (w as unknown as { totalDistance?: { quantity: number; unit: string } }).totalDistance;
    const km = dist ? (dist.unit === 'km' ? dist.quantity : dist.unit === 'mi' ? dist.quantity * 1.609344 : dist.quantity / 1000) : null;
    const e = w.totalEnergyBurned;
    return {
      id: String(w.uuid), type: raw, start_at: new Date(w.startDate).toISOString(), end_at: new Date(w.endDate).toISOString(),
      minutes: Math.round((secs / 60) * 10) / 10, km: km != null ? Math.round(km * 1000) / 1000 : null,
      kcal: e ? Math.round(e.unit === 'kJ' ? e.quantity / 4.184 : e.quantity) : null,
      source: w.sourceRevision?.source?.name ?? null, meta: plain(w.metadata),
    };
  });
}

/** Sleep stages, mindful sessions, stand hours and heart alerts between two dates. */
export async function vaultEvents(from: string, to: string): Promise<VaultEvent[]> {
  const start = dayStart(from), end = new Date(dayStart(to).getTime() + DAY);
  const out: VaultEvent[] = [];
  for (const id of VAULT_EVENTS) {
    const list = await queryCategorySamples(`HKCategoryTypeIdentifier${id}` as never, { limit: 0, ...range(start, end) } as never).catch(() => []);
    for (const s of list) out.push({ id: String(s.uuid), kind: id, value: Number.isFinite(Number(s.value)) ? Number(s.value) : null,
      start_at: new Date(s.startDate as unknown as string).toISOString(), end_at: new Date(s.endDate as unknown as string).toISOString(),
      source: s.sourceRevision?.source?.name ?? null });
  }
  return out;
}
