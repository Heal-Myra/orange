// Phone reminders at the switch-overs of the person's usual day (founder, 22 Oct 2026): five minutes before each
// change (reaching office, tea break, lunch, the drive home, family time…), ONE fitting nudge: the next Work to-do at
// office moments, the next Family to-do at family time, "snap your lunch" at meals. Each to-do is used once, the
// next one goes with the next moment. Local notifications only: nothing leaves the phone.
// Re-planned whenever the app opens, the to-do list changes or the usual day changes. iPhone app only.

import { useEffect } from 'react';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';
import { useHeal } from '../lib/store';
import { useTasks, type Task } from '../lib/tasks';
import { itemsFor, LEAD_MINUTES, type RoutineItem } from '../lib/routine';
import { habitsToday } from '../lib/habits';
import { lang, tr } from '../lib/i18n';
import { todayISO } from '../lib/dates';
import { optional } from '../lib/native';
import { WEIGHT_NUDGE, usesScale, weighedOn } from '../lib/weightNudge';

// Arrived with build 7; older installed builds simply schedule nothing.
let N: typeof import('expo-notifications') | null = null;
N = optional(['ExpoNotificationsEmitter', 'ExpoNotificationScheduler', 'ExpoNotificationPermissionsModule'], () => require('expo-notifications'));

const at = (day: Date, hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); const d = new Date(day); d.setHours(h, m - LEAD_MINUTES, 0, 0); return d; };

/** The nudge for one moment, taking the next unused to-do of the right group when it needs one. */
export function nudgeFor(it: RoutineItem, take: (area: Task['area']) => Task | undefined, morning: boolean, fasting = false): string {
  const task = (area: Task['area'], prefix: string) => { const t = take(area); return t ? `${prefix}: ${t.title}` : null; };
  switch (it.kind) {
    case 'work': return task('work', tr('Work')) ?? tr('Start with the one task that matters most today.');
    case 'break': return task('work', tr('Work')) ?? tr('Drink a glass of water.');
    case 'commute': return morning ? (task('work', tr('Work')) ?? tr('Plan the first task for when you arrive.')) : tr('Listen to something you can learn from.');
    case 'family': return task('family', tr('Family')) ?? tr('Put the phone away and be with your family.');
    case 'meal': return fasting ? tr('Fasting today: a glass of water instead.') : tr('Snap your {meal} in Food before eating.', { meal: it.what.toLowerCase() });
    case 'exercise': case 'walk': return tr('Time for {what}.', { what: it.what.toLowerCase() });
    case 'sport': return tr('Enjoy {what}. Drink water after.', { what: it.what.toLowerCase() });
    case 'learning': return tr('Read today\'s Daily Wisdom slowly.');
    case 'wake': return tr('Good morning. Write four gratitudes and plan your day.');
    case 'reading': return tr('Read today\'s Daily Wisdom slowly.');
    case 'sleep': return tr('Lie down for Yoga Nidra in Happy Orange, then sleep.');
    default: return task('self', tr('Better me')) ?? tr('One small step for yourself.');
  }
}

export function ReminderScheduler() {
  const { profile, days } = useHeal();
  const dayStart = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  const weighed = weighedOn(days[todayISO()], dayStart);
  const scale = usesScale(days);
  const fastingToday = !!days[todayISO()]?.fasting;
  const { open, habits } = useTasks();
  const doneToday = days[todayISO()]?.habitsDone ?? [];
  const doneKey = doneToday.join(',');
  const routine = profile.me?.routine;

  useEffect(() => {
    if (!N || (!routine?.length && !habits.length && !scale)) return;
    const Notif = N;
    let cancelled = false;
    const plan = async () => {
      const perm = await Notif.getPermissionsAsync();
      let granted = perm.granted;
      if (!granted && perm.canAskAgain) granted = (await Notif.requestPermissionsAsync()).granted;
      if (!granted || cancelled) return;
      await Notif.cancelAllScheduledNotificationsAsync();
      // Each to-do is used once; the next moment gets the next one (oldest due first, as on the list).
      const queues: Record<string, Task[]> = { work: [], family: [], self: [] };
      for (const t of open) queues[t.area]?.push(t);
      const take = (area: Task['area']) => queues[area]?.shift();
      const now = Date.now(), horizon = now + 26 * 3600 * 1000;
      for (const offset of [0, 1]) {
        const day = new Date(); day.setDate(day.getDate() + offset);
        // No weight by 3 pm (founder, 25 Oct 2026): the Withings app sends weighings to Apple Health only when it runs.
        if (scale && !(offset === 0 && weighed)) {
          const [h, m] = WEIGHT_NUDGE.split(':').map(Number);
          const when = new Date(day); when.setHours(h, m, 0, 0);
          if (when.getTime() > now + 30_000 && when.getTime() <= horizon) {
            await Notif.scheduleNotificationAsync({
              content: { title: tr('Weight'), body: tr('No weight today yet. Open the Withings app once to sync it.'), data: { kind: 'weight', lang: lang() } },
              trigger: { type: Notif.SchedulableTriggerInputTypes.DATE, date: when },
            });
            if (cancelled) return;
          }
        }
        // Habits at their time (founder, 23 Oct 2026), five minutes early like the rest.
        for (const h of habitsToday(habits, day)) {
          if (!h.at || (offset === 0 && doneToday.includes(h.id))) continue;
          const when = at(day, h.at);
          if (when.getTime() <= now + 30_000 || when.getTime() > horizon) continue;
          await Notif.scheduleNotificationAsync({
            content: { title: tr('Habit'), body: `${h.at} · ${h.title}`, data: { kind: 'habit', lang: lang() } },
            trigger: { type: Notif.SchedulableTriggerInputTypes.DATE, date: when },
          });
          if (cancelled) return;
        }
        for (const it of itemsFor(routine ?? [], day)) {
          const when = at(day, it.at);
          if (when.getTime() <= now + 30_000 || when.getTime() > horizon) continue;
          const body = nudgeFor(it, take, when.getHours() < 12, offset === 0 && fastingToday);
          await Notif.scheduleNotificationAsync({
            content: { title: it.what, body, data: { kind: it.kind, lang: lang() } },
            trigger: { type: Notif.SchedulableTriggerInputTypes.DATE, date: when },
          });
          if (cancelled) return;
        }
      }
    };
    plan().catch(() => { /* reminders are a bonus; never break the app */ });
    // Tapping the bedtime reminder opens the guided Yoga Nidra (founder, 22 Oct 2026).
    let tap: { remove: () => void } | null = null;
    try {
      tap = Notif.addNotificationResponseReceivedListener(r => {
        const kind = (r.notification.request.content.data as { kind?: string } | undefined)?.kind;
        if (kind === 'sleep') router.push('/yoga-nidra');
        else if (kind === 'weight') router.navigate({ pathname: '/body', params: { card: 'body', at: String(Date.now()) } });
      });
    } catch { tap = null; }
    const sub = AppState.addEventListener('change', s => { if (s === 'active') plan().catch(() => {}); });
    return () => { cancelled = true; sub.remove(); tap?.remove(); };
  }, [routine, open, fastingToday, habits, doneKey, weighed, scale]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
