// Today's meditation sessions, one line each (founder, 5 Nov 2026): so the minutes behind the Meditation score can be
// seen. Each session is saved with its kind, name (English, shown through tr), minutes and time.

import type { DayLog } from './types';

export type SessionKind = 'dhamma' | 'guided' | 'nidra' | 'self';
export interface MedSession { kind: SessionKind; name: string; min: number; at: string }

/** Add minutes to the day and remember the session. */
export function addSession(d: DayLog, kind: SessionKind, name: string, min: number) {
  if (min <= 0) return;
  d.mind.meditationMin = (d.mind.meditationMin ?? 0) + min;
  d.mind.medSessions = [...(d.mind.medSessions ?? []), { kind, name, min, at: new Date().toISOString() }];
}

/** Minutes today that no saved session explains (earlier today before this list, or Apple Health mindful minutes). */
export const unlisted = (d: DayLog) => Math.max(0, (d.mind.meditationMin ?? 0) - (d.mind.medSessions ?? []).reduce((t, s) => t + s.min, 0));
