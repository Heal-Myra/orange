// The 3 pm "no weight yet" reminder (founder, 25 Oct 2026). The Withings app passes weighings to Apple Health only
// when it runs, so if today has no weight by 3 pm, one gentle nudge asks the person to open it once. Only for people who
// weigh on a scale; scheduled in src/components/Reminders.tsx.

/** Whether a day already has a weight (from the scale through Apple Health, or typed that day). */
export function weighedOn(d: { health?: { weightAt?: number; weightTyped?: boolean; weightTypedAt?: number } } | undefined, dayStart: number): boolean {
  const h = d?.health;
  return !!h && ((h.weightAt ?? 0) >= dayStart || (!!h.weightTyped && (h.weightTypedAt ?? 0) >= dayStart));
}

/** People who weigh on a scale: a scale weighing reached Happy Orange in the last two weeks. */
export function usesScale(days: Record<string, { health?: { weightAt?: number } }>, now = Date.now()): boolean {
  return Object.values(days).some(d => (d.health?.weightAt ?? 0) > now - 14 * 86_400_000);
}

export const WEIGHT_NUDGE = '15:00'; // founder, 25 Oct 2026: nudge at 3 pm if today has no weight yet
