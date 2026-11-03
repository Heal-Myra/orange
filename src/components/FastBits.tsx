// Fasting by choice on the Food card (decision 0044): the soft blue line with the fast so far, and Myra's one-time
// question when breakfast has been missing three days running and she does not yet know whether it is on purpose.

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { shiftISO, todayISO } from '../lib/dates';
import { FAST_FROM, FOOD_PARTS, FOOD_V3_FROM, aimShares, fastHabit, fastHoursOf, fmtHours, foodV3, type FastHabit } from '../lib/fasting';
import { foodScore, mealTotals } from '../lib/scoring';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { PASTEL } from './Rings';
import type { AboutMe } from '../lib/targets';

const SKY_INK = '#2F567A';

/** The habit and today's fast, re-read every minute so the hours keep moving. From 3 Nov 2026 everyone has a fast
 *  (14 h unless they fast longer by choice). */
export function useFast() {
  const { day, date, profile } = useHeal();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 60_000); return () => clearInterval(t); }, []);
  if (date >= FOOD_V3_FROM) {
    const v = foodV3Of(day, profile);
    return { habit: { hours: v.fastTarget, lastMeal: '' }, hours: v.fastHours, since: v.since, ongoing: v.ongoing && !day.meals.length };
  }
  const habit = date >= FAST_FROM ? fastHabit(profile.me) : null;
  return habit ? { habit, ...fastHoursOf(day, habit) } : null;
}

/** Today's Food parts (decision 0047). */
export function foodV3Of(day: import('../lib/types').DayLog, profile: import('../lib/types').Profile) {
  const t = mealTotals(day.meals), energy = t.p * 4 + t.c * 4 + t.f * 9;
  return foodV3(day, profile.me, day.meals.length ? foodScore(t, profile.kcal).total : null,
    energy ? { carb: (t.c * 4) / energy, fat: (t.f * 9) / energy } : null, aimShares(profile.kcal, profile.protein));
}

/** The three Food rings from 3 Nov 2026: Fasting, Dinner time, Meals. */
export function foodV3Rings(v: ReturnType<typeof foodV3Of>) {
  return [
    { id: 'fast', color: PASTEL.sky, label: tr('Fasting'), value: v.fasting / FOOD_PARTS.fasting, text: `${fmtHours(Math.min(v.fastHours, v.fastTarget))} / ${v.fastTarget} h` },
    { id: 'dinner', color: PASTEL.lavender, label: tr('Early dinner'), value: v.dinner / FOOD_PARTS.dinner, text: v.dinnerGap == null ? '–' : `${fmtHours(Math.max(0, v.dinnerGap))} / 3 h` },
    { id: 'meals', color: PASTEL.peach, label: tr('Meals'), value: v.meals / FOOD_PARTS.meals, text: `${Math.round(v.meals)} / ${FOOD_PARTS.meals}` },
  ];
}

/** Shown only when carbs or fat gave too many of the calories: what it cost. */
export function FoodPenalty({ v }: { v: ReturnType<typeof foodV3Of> }) {
  if (v.penalty < 0.5) return null;
  const what = v.carbOver && v.fatOver ? tr('Carbs and fat above your aim') : v.carbOver ? tr('Carbs above your aim') : tr('Fat above your aim');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: PASTEL.sand + '22' }}>
      <Ionicons name="trending-down-outline" size={18} color={colors.ink} />
      <Text style={{ flex: 1, color: colors.ink, fontSize: 14.5 }}>{what}</Text>
      <Text style={{ color: '#9A7A3A', fontWeight: '800', fontSize: 15 }}>−{Math.round(v.penalty * 2) / 2}</Text>
    </View>
  );
}

const clock = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export function FastStatus() {
  const f = useFast();
  if (!f) return null;
  const left = f.habit.hours - f.hours;
  const text = f.ongoing
    ? left > 0 ? tr('Fasting since {t} · {h} h to your {n}', { t: clock(f.since), h: fmtHours(left), n: f.habit.hours }) : tr('Fast kept: {h} h · eat when you are ready', { h: fmtHours(f.hours) })
    : f.hours >= f.habit.hours ? tr('Fast kept: {h} h', { h: fmtHours(Math.min(f.hours, 48)) }) : tr('Fasted {h} h of {n}', { h: fmtHours(f.hours), n: f.habit.hours });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: PASTEL.sky + '22' }}>
      <Ionicons name="moon-outline" size={18} color={SKY_INK} />
      <Text style={{ flex: 1, color: SKY_INK, fontSize: 14.5 }}>{text}</Text>
    </View>
  );
}

/** Three days running with the first meal at 11 am or later, and no answer yet: ask once. */
export function FastAsk() {
  const { days, date, profile, setProfile } = useHeal();
  const me = profile.me;
  if (!me || me.fast || date !== todayISO() || fastHabit(me)) return null;
  const late = [1, 2, 3].every(n => {
    const d = days[shiftISO(date, -n)];
    const times = (d?.meals ?? []).map(m => m.at).filter(Boolean) as string[];
    return d && d.date >= FAST_FROM && times.length > 0 && times.length === d.meals.length && new Date(times.sort()[0]).getHours() >= 11;
  });
  if (!late) return null;
  const set = (fast: NonNullable<AboutMe['fast']>) => setProfile({ ...profile, me: { ...me, fast } });
  const chip = (label: string, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 99, borderWidth: 1, borderColor: colors.line }}>
      <Text style={{ color: colors.ink, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 8, padding: 12, borderRadius: 16, backgroundColor: colors.insight + '0D' }}>
      <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700' }}>{tr('Do you fast on purpose?')}</Text>
      <Text style={{ color: colors.muted, fontSize: 13.5 }}>{tr('No breakfast for 3 days. If you fast by choice, the hours without food will earn points.')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[14, 16, 18].map(h => chip(`${h} h`, () => set({ hours: h, lastMeal: '21:00' })))}
        {chip(tr('No, I just forget'), () => set({ hours: 0, lastMeal: '21:00', off: true }))}
      </View>
    </View>
  );
}

/** The Fasting ring for the Food card. */
export const fastRing = (f: { habit: FastHabit; hours: number }) => ({
  id: 'fast', color: PASTEL.sky, label: tr('Fasting'), value: Math.min(1, f.hours / f.habit.hours),
  text: `${fmtHours(Math.min(f.hours, f.habit.hours))} / ${f.habit.hours} h`,
});
