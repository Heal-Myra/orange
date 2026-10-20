// Apple Health is iPhone-only (src/lib/health.ios.ts). On the web and Android it is simply not available;
// Android's Health Connect comes later (docs/decisions/0011-native-app-and-apple-health.md).

export interface HealthDay { steps?: number; activeMin?: number; sleepHours?: number }

export const healthAvailable = (): boolean => false;
export async function connectHealth(): Promise<boolean> { return false; }
export async function readHealthDay(_iso: string): Promise<HealthDay> { return {}; }
