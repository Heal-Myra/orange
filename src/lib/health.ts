// Apple Health is iPhone-only (src/lib/health.ios.ts). On the web and Android it is simply not available;
// Android's Health Connect comes later (docs/decisions/0011-native-app-and-apple-health.md).

export interface HealthDay {
  steps?: number; activeMin?: number; sleepHours?: number; sleepBed?: string; // sleepBed: when sleep began last night (ISO)
  // Added 20 Oct 2026 (founder): body measures (latest), heart and recovery, energy, mindful minutes, workouts, sleep stages.
  weightKg?: number; weightAt?: number; bodyFatPct?: number; restingHr?: number; hrv?: number; vo2max?: number;
  activeKcal?: number; mindfulMin?: number;
  workouts?: { type: string; min: number; kcal?: number }[];
  sleepStages?: { deep?: number; core?: number; rem?: number; awake?: number };
}

export const HEALTH_READ_VERSION = 3;
export const healthAvailable = (): boolean => false;
export async function connectHealth(): Promise<boolean> { return false; }
export async function readHealthDay(_iso: string): Promise<HealthDay> { return {}; }
/** Every run in Apple Health (founder, 11 Nov 2026: "fastest 5 km" on the Watch was missing from Top of My Game). */
export interface Run { at: string; km: number; secs: number }
export async function readRuns(): Promise<Run[]> { return []; }

// The health vault (11 Nov 2026): Apple Health only, so empty here.
export interface VaultDaily { date: string; metric: string; unit: string; sum: number | null; avg: number | null; min: number | null; max: number | null }
export interface VaultWorkout { id: string; type: string; start_at: string; end_at: string; minutes: number; km: number | null; kcal: number | null; source: string | null; meta: unknown }
export interface VaultEvent { id: string; kind: string; value: number | null; start_at: string; end_at: string; source: string | null }
export async function vaultDaily(_from: string, _to: string): Promise<VaultDaily[]> { return []; }
export async function vaultWorkouts(_from: string, _to: string): Promise<VaultWorkout[]> { return []; }
export async function vaultEvents(_from: string, _to: string): Promise<VaultEvent[]> { return []; }
