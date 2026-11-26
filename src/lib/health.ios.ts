// Apple Health on iPhone (and through it, Apple Watch and apps such as Withings that share into Health).
// Read-only; Happy Orange never writes to Apple Health. The web and Android builds use src/lib/health.ts instead.
// 20 Oct 2026 (founder): besides steps, exercise minutes and sleep, also weight and body fat, resting heart rate,
// heart rate variability, cardio fitness (VO2 max), active energy, mindful minutes, workouts and sleep stages.

import {
  getMostRecentQuantitySample,
  isHealthDataAvailable,
  queryCategorySamples,
  queryStatisticsForQuantity,
  queryStatisticsCollectionForQuantity,
  queryWorkoutSamples,
  requestAuthorization,
  WorkoutActivityType,
} from '@kingstinct/react-native-healthkit';
import type { DaySeries, HealthDay, Run, SleepDetail } from './health';

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
  // The same source can write the same stretch twice (a re-sync, or two of its devices): count overlapping time once,
  // per stage (founder, 15 Nov 2026: 7-8 hours slept showed as 13.1, with 4.1 h deep).
  type Span = [number, number];
  const names: Record<string, string> = {};
  const bySpans: Record<string, Record<'asleep' | 'deep' | 'core' | 'rem' | 'awake' | 'inBed', Span[]>> = {};
  for (const s of samples) {
    const v = Number(s.value);
    const a = new Date(s.startDate as unknown as string).getTime(), b = new Date(s.endDate as unknown as string).getTime();
    if (!(b > a)) continue;
    const key = s.sourceRevision?.source?.bundleIdentifier ?? 'unknown';
    names[key] ??= s.sourceRevision?.source?.name ?? key;
    const g = (bySpans[key] ??= { asleep: [], deep: [], core: [], rem: [], awake: [], inBed: [] });
    if (v === 0) g.inBed.push([a, b]);
    if (v === 2) g.awake.push([a, b]);
    if (v === 1 || v >= 3) g.asleep.push([a, b]);
    if (v === 3) g.core.push([a, b]);
    if (v === 4) g.deep.push([a, b]);
    if (v === 5) g.rem.push([a, b]);
  }
  const union = (xs: Span[]) => { let ms = 0, upTo = -Infinity; for (const [a, b] of [...xs].sort((x, y) => x[0] - y[0])) { if (b <= upTo) continue; ms += b - Math.max(a, upTo); upTo = b; } return ms; };
  const bySource: Record<string, { asleep: number; deep: number; core: number; rem: number; awake: number; bed?: number; wake?: number; inBedFrom?: number; wakeUps: number }> = {};
  for (const [key, g] of Object.entries(bySpans)) {
    const bed = g.asleep.length ? Math.min(...g.asleep.map(x => x[0])) : undefined; // first fell asleep
    const wake = g.asleep.length ? Math.max(...g.asleep.map(x => x[1])) : undefined; // last woke up
    // Times woken: separate awake stretches between falling asleep and the final waking (touching ones count once).
    let wakeUps = 0, upTo = -Infinity;
    for (const [a, b] of [...g.awake].sort((x, y) => x[0] - y[0])) { if (bed == null || wake == null || a <= bed || b >= wake) continue; if (a > upTo + 60000) wakeUps++; upTo = Math.max(upTo, b); }
    bySource[key] = { asleep: union(g.asleep), deep: union(g.deep), core: union(g.core), rem: union(g.rem), awake: union(g.awake), bed, wake,
      inBedFrom: g.inBed.length ? Math.min(...g.inBed.map(x => x[0])) : undefined, wakeUps };
  }
  // One device per night, never added together: an Oura ring when it recorded the night (bought for sleep, worn all
  // night), otherwise the device that recorded the most sleep (founder, 15 Nov 2026).
  const keys = Object.keys(bySource).filter(k => bySource[k].asleep > 0);
  const oura = keys.find(k => /oura/i.test(k) || /oura/i.test(names[k] ?? ''));
  const pick = oura ?? keys.sort((a, b) => bySource[b].asleep - bySource[a].asleep)[0];
  const best = pick ? bySource[pick] : undefined;
  if (!best || best.asleep <= 0) return { hours: undefined, stages: undefined };
  const h = (ms: number) => (ms > 0 ? r1(ms / 3600000) : undefined);
  const staged = best.deep + best.core + best.rem > 0;
  // The rest of the night (decision 0064): time in bed, minutes to fall asleep, times woken, and the night's vitals.
  const from = best.inBedFrom != null && best.bed != null && best.inBedFrom < best.bed ? best.inBedFrom : best.bed;
  const latency = best.inBedFrom != null && best.bed != null && best.inBedFrom <= best.bed ? Math.round((best.bed - best.inBedFrom) / 60000) : undefined;
  let vit: Partial<SleepDetail> = {};
  if (best.bed != null && best.wake != null) {
    const a = new Date(best.bed), b = new Date(best.wake);
    const [lo, avg, hrv, rr, o2] = await Promise.all([
      queryStatisticsForQuantity('HKQuantityTypeIdentifierHeartRate' as never, ['discreteMin'] as never, { ...range(a, b), unit: 'count/min' } as never).then(r => (r as { minimumQuantity?: { quantity: number } }).minimumQuantity?.quantity).catch(() => undefined),
      stat('HKQuantityTypeIdentifierHeartRate', 'discreteAverage', 'count/min', a, b).catch(() => undefined),
      stat('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', 'discreteAverage', 'ms', a, b).catch(() => undefined),
      stat('HKQuantityTypeIdentifierRespiratoryRate', 'discreteAverage', 'count/min', a, b).catch(() => undefined),
      stat('HKQuantityTypeIdentifierOxygenSaturation', 'discreteAverage', '%', a, b).catch(() => undefined),
    ]);
    vit = { lowestHr: lo != null ? Math.round(lo) : undefined, avgHr: avg != null ? Math.round(avg) : undefined, hrvNight: hrv != null ? Math.round(hrv) : undefined,
      respRate: rr != null ? r1(rr) : undefined, spo2: o2 != null ? r1(o2 <= 1 ? o2 * 100 : o2) : undefined };
  }
  const detail: SleepDetail = {
    inBed: from != null && best.wake != null ? h(best.wake - from) : undefined,
    latencyMin: latency != null && latency <= 180 ? latency : undefined,
    wakeUps: staged || best.awake > 0 ? best.wakeUps : undefined,
    awakeMin: best.awake > 0 ? Math.round(best.awake / 60000) : staged ? 0 : undefined,
    wakeAt: best.wake ? new Date(best.wake).toISOString() : undefined,
    ...vit,
  };
  return { from: names[pick!] ?? undefined, hours: h(best.asleep), bed: best.bed ? new Date(best.bed).toISOString() : undefined, stages: staged ? { deep: h(best.deep), core: h(best.core), rem: h(best.rem), awake: h(best.awake) } : undefined, detail };
}

/** The night's temperature (16 Nov 2026, cool room for deep sleep): the Watch's sleeping wrist temperature, else a
 *  body temperature written in the night (an Oura ring or another app through Health), 6 pm to noon. */
async function nightTemp(iso: string) {
  const start = new Date(dayStart(iso).getTime() - 6 * 3600 * 1000), end = new Date(dayStart(iso).getTime() + 12 * 3600 * 1000);
  const w = await stat('HKQuantityTypeIdentifierAppleSleepingWristTemperature', 'discreteAverage', 'degC', start, end).catch(() => undefined);
  if (w != null) return Math.round(w * 100) / 100;
  const b = await stat('HKQuantityTypeIdentifierBodyTemperature', 'discreteAverage', 'degC', start, end).catch(() => undefined);
  return b != null ? Math.round(b * 100) / 100 : undefined;
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
  const [steps, activeMin, activeKcal, sleep, weight, fat, rhr, hrv, vo2, mindful, workouts, temp] = await Promise.all([
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
    safe(nightTemp(iso)),
  ]);
  return {
    steps: steps != null ? Math.round(steps) : undefined,
    activeMin: activeMin != null ? Math.round(activeMin) : undefined,
    sleepHours: sleep?.hours,
    sleepBed: sleep?.bed,
    sleepFrom: sleep?.from,
    sleepStages: sleep?.stages,
    sleepDetail: sleep?.detail,
    activeKcal: activeKcal != null ? Math.round(activeKcal) : undefined,
    weightKg: weight != null ? r1(weight.value) : undefined,
    weightAt: weight?.at,
    bodyFatPct: fat != null ? r1(fat <= 1 ? fat * 100 : fat) : undefined,
    restingHr: rhr != null ? Math.round(rhr) : undefined,
    hrv: hrv != null ? Math.round(hrv) : undefined,
    vo2max: vo2 != null ? r1(vo2) : undefined,
    mindfulMin: mindful,
    nightTempC: temp,
    workouts,
  };
}

/** The day in 15-minute steps (founder, 26 Nov 2026: "Food and your body"): average heart rate from any source in
 *  Apple Health (the Oura ring or a Watch) and steps, 96 slots from midnight. Null where nothing was measured. */
export async function readDaySeries(iso: string): Promise<DaySeries> {
  const start = dayStart(iso), end = new Date(start.getTime() + DAY);
  const slot = (d?: Date) => (d ? Math.floor((d.getTime() - start.getTime()) / 900_000) : -1);
  const fill = async (id: string, kind: 'discreteAverage' | 'cumulativeSum', unit: string) => {
    const out: (number | null)[] = Array(96).fill(null);
    const rows = await queryStatisticsCollectionForQuantity(id as never, [kind] as never, start, { minute: 15 }, { ...range(start, end), unit } as never).catch(() => []);
    for (const r of rows as readonly { averageQuantity?: { quantity: number }; sumQuantity?: { quantity: number }; startDate?: Date }[]) {
      const i = slot(r.startDate ? new Date(r.startDate) : undefined);
      const q = kind === 'discreteAverage' ? r.averageQuantity?.quantity : r.sumQuantity?.quantity;
      if (i >= 0 && i < 96 && q != null) out[i] = Math.round(q);
    }
    return out;
  };
  const [hr, steps] = await Promise.all([fill('HKQuantityTypeIdentifierHeartRate', 'discreteAverage', 'count/min'), fill('HKQuantityTypeIdentifierStepCount', 'cumulativeSum', 'count')]);
  return { hr15: hr, steps15: steps.map(v => v ?? 0) };
}

/** Steps between two moments (walk after dinner, 16 Nov 2026). */
export async function stepsBetween(a: Date, b: Date): Promise<number | undefined> {
  const n = await safe(stat('HKQuantityTypeIdentifierStepCount', 'cumulativeSum', 'count', a, b));
  return n != null ? Math.round(n) : undefined;
}

/** Every run of the last 5 years with its distance and time (founder, 11 Nov 2026: Top of My Game missed the Watch's
 *  "fastest 5 km"). Read straight from Apple Health, so runs from before Happy Orange count too. */
export async function readRuns(): Promise<Run[]> {
  const end = new Date(), start = new Date(end.getTime() - 5 * 365 * DAY);
  const list = await queryWorkoutSamples({ limit: 0, ...range(start, end) } as never).catch(() => []);
  const pad = (n: number) => String(n).padStart(2, '0');
  const runs = list.flatMap(w => {
    const raw = (WorkoutActivityType as unknown as Record<number, string>)[w.workoutActivityType as unknown as number] ?? '';
    if (raw !== 'running') return [];
    const dist = (w as unknown as { totalDistance?: { quantity: number; unit: string } }).totalDistance;
    if (!dist) return [];
    const km = dist.unit === 'km' ? dist.quantity : dist.unit === 'mi' ? dist.quantity * 1.609344 : dist.quantity / 1000;
    const d = w.duration as unknown as { quantity: number; unit: string } | number;
    const secs = typeof d === 'number' ? d : d.unit === 'min' ? d.quantity * 60 : d.unit === 'hr' ? d.quantity * 3600 : d.quantity;
    const t = new Date(w.startDate), e = new Date(w.endDate);
    return km > 0.5 && secs > 60 ? [{ at: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`, km, secs, start: t, end: e }] : [];
  });
  // Steps during the last 10 runs of the last 60 days, for cadence (16 Nov 2026).
  const recent = runs.filter(r => r.start.getTime() > end.getTime() - 60 * DAY).sort((a, b) => b.start.getTime() - a.start.getTime()).slice(0, 10);
  const steps = new Map(await Promise.all(recent.map(async r => [r.start.getTime(), await safe(stat('HKQuantityTypeIdentifierStepCount', 'cumulativeSum', 'count', r.start, r.end))] as const)));
  return runs.map(({ at, km, secs, start: t0 }) => { const s = steps.get(t0.getTime()); return s ? { at, km, secs, steps: Math.round(s) } : { at, km, secs }; });
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
