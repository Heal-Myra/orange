// The person's usual day (founder, 22 Oct 2026). Written in their own words on About you; Myra (AI action
// routine_plan) turns it into a timetable. Five minutes before each switch-over (reaching office, tea break, lunch,
// the drive home, family time…) Myra recommends moves on, and puts ONE fitting thing in front of the person:
// a Work to-do at office moments, a Family to-do at family time, Learning on the drive home, a meal photo at meals.

export type RoutineKind =
  | 'wake' | 'exercise' | 'family' | 'commute' | 'work' | 'break' | 'meal' | 'sport'
  | 'learning' | 'walk' | 'reading' | 'sleep' | 'other';

export interface RoutineItem {
  at: string;        // "HH:MM", 24-hour, local
  what: string;      // the person's own short label, e.g. "Tea break", "Lunch", "Drive home, podcast"
  kind: RoutineKind;
  days?: 'weekdays' | 'weekend' | 'daily'; // default daily
}

export const LEAD_MINUTES = 5; // the switch happens this many minutes before the activity

const mins = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const appliesOn = (it: RoutineItem, d: Date) => {
  const weekday = d.getDay() >= 1 && d.getDay() <= 5;
  return !it.days || it.days === 'daily' || (it.days === 'weekdays' ? weekday : !weekday);
};

/** Today's items in time order. */
export function itemsFor(routine: RoutineItem[], d = new Date()): RoutineItem[] {
  return routine.filter(it => /^\d{1,2}:\d{2}$/.test(it.at) && appliesOn(it, d)).sort((a, b) => mins(a.at) - mins(b.at));
}

/** What the person is doing now (the activity whose switch-over, 5 minutes early, has passed) and what comes next. */
export function momentOf(routine: RoutineItem[] | undefined, d = new Date()): { now: RoutineItem; next?: RoutineItem; key: string } | null {
  if (!routine?.length) return null;
  const list = itemsFor(routine, d);
  if (!list.length) return null;
  const t = d.getHours() * 60 + d.getMinutes() + LEAD_MINUTES;
  let idx = -1;
  for (let i = 0; i < list.length; i++) if (mins(list[i].at) <= t) idx = i;
  // Before the first item of the day: still the last item of last night (usually sleep).
  const now = idx >= 0 ? list[idx] : list[list.length - 1];
  const next = idx + 1 < list.length ? list[idx + 1] : undefined;
  return { now, next, key: `${now.at} ${now.what}` };
}

/** What Myra should put in front of the person at this kind of moment (used in her instructions and in reminders). */
export const KIND_HINT: Record<RoutineKind, string> = {
  wake: 'Soul: write the four gratitudes; Mind: pick the first to-do of the day',
  exercise: 'Body: the walk or exercise, with minutes',
  family: 'Mind: one Family to-do',
  commute: 'Mind: if going to work, the first Work to-do to start with; if coming home, listen and learn (Learning)',
  work: 'Mind: one Work to-do',
  break: 'Mind: one quick Work to-do; Body: water',
  meal: 'Body: snap the plate in Food before eating',
  sport: 'Body: enjoy the game; drink water after',
  learning: 'Mind: write what you learned (Learning, up to 10 words)',
  walk: 'Body: the walk, with minutes',
  reading: 'Soul: Daily Wisdom; read slowly',
  sleep: 'Soul: 5 minutes of slow breathing; Body: screens away',
  other: 'the one most useful small thing',
};

/** One line for Myra's context. */
export function momentLine(routine: RoutineItem[] | undefined, d = new Date()): string {
  const m = momentOf(routine, d);
  if (!m) return 'Usual day: not given.';
  return `Moment in their usual day: now "${m.now.what}" (${m.now.kind}, from ${m.now.at})${m.next ? `; next "${m.next.what}" at ${m.next.at}` : ''}. Put in front of them: ${KIND_HINT[m.now.kind]}.`;
}
