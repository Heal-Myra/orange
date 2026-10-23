// Apple Health is iPhone-only (src/lib/health.ios.ts). On the web and Android it is simply not available;
// Android's Health Connect comes later (docs/decisions/0011-native-app-and-apple-health.md).

export interface HealthDay {
  steps?: number; activeMin?: number; sleepHours?: number;
  // Added 20 Oct 2026 (founder): body measures (latest), heart and recovery, energy, mindful minutes, workouts, sleep stages.
  weightKg?: number; weightAt?: number; bodyFatPct?: number; restingHr?: number; hrv?: number; vo2max?: number;
  activeKcal?: number; mindfulMin?: number;
  workouts?: { type: string; min: number; kcal?: number }[];
  sleepStages?: { deep?: number; core?: number; rem?: number; awake?: number };
}

export const HEALTH_READ_VERSION = 2;
export const healthAvailable = (): boolean => false;
export async function connectHealth(): Promise<boolean> { return false; }
export async function readHealthDay(_iso: string): Promise<HealthDay> { return {}; }
