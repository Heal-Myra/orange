// Myra's one line at the bottom of every scored card (founder, 31 Oct 2026: "score rings, their details at the side and
// at the bottom Myra recommends"). When Myra's latest recommendation is about this card, her line is shown; otherwise a
// short, ready-made next step from the card's own numbers (no extra AI request). One line, at most 10 words.

import { Text, View } from 'react-native';
import { oneLine } from '../lib/ai';
import { tr } from '../lib/i18n';
import { lived, mealTotals, taoStudied, wisdomStudied } from '../lib/scoring';
import { useHeal } from '../lib/store';
import { fibreTarget } from '../lib/targets';
import { colors } from '../theme';
import type { DayLog, Profile } from '../lib/types';

export type CardId = 'food' | 'sleep' | 'movement' | 'face' | 'tasks' | 'meditation' | 'phone' | 'gratitude' | 'wisdom' | 'tao';

const PILLAR: Record<CardId, 'body' | 'mind' | 'soul' | null> = {
  food: 'body', sleep: 'body', movement: 'body', face: null, tasks: 'mind', meditation: 'mind', phone: 'mind', gratitude: 'soul', wisdom: 'soul', tao: 'soul',
};

/** A ready-made next step from the card's own numbers, as [English text, values]. */
export function localTip(card: CardId, d: DayLog, P: Profile, phone?: { minutes: number; social?: number } | null): [string, Record<string, string | number>?] {
  switch (card) {
    case 'food': {
      if (d.fasting) return ['Sip water through the day; break the fast gently.'];
      const t = mealTotals(d.meals);
      if (!d.meals.length) return ['Snap your next meal before eating.'];
      if (t.kcal > P.kcal) return ['Keep dinner light: soup, dal and sabzi.'];
      if (t.p < 0.6 * P.protein) return ['Add dal, paneer or eggs for protein.'];
      if ((t.fib ?? 0) < 0.6 * fibreTarget(P.kcal)) return ['Add a fruit or salad for fibre.'];
      return ['Well balanced today. Keep it going.'];
    }
    case 'sleep':
      if (d.sleep.hours == null) return ['Add last night\'s sleep hours.'];
      return d.sleep.hours < 7 ? ['Lights out by 10:30 tonight.'] : ['Good sleep. Keep the same bedtime tonight.'];
    case 'movement': {
      const poor = (d.air?.aqi ?? 0) > 200;
      const steps = d.activity.steps ?? 0, act = d.activity.activeMin ?? 0;
      if (steps >= P.steps && act >= P.active) return ['Target reached. Stretch for 5 minutes.'];
      if (poor) return ['Walk indoors 15 minutes; the air is poor today.'];
      return steps < P.steps / 2 ? ['Walk 10 minutes after your next meal.'] : ['Add 10 brisk minutes to reach your target.'];
    }
    case 'face':
      return d.face?.tips?.[0] ? [d.face.tips[0]] : ['Take a selfie in daylight for a skin check.'];
    case 'tasks':
      return (d.mind.focusDone ?? 0) >= 2 ? ['Two done. Enjoy a clear mind.'] : ['Finish one to-do from today\'s list.'];
    case 'meditation': {
      const left = Math.max(0, P.meditation - (d.mind.meditationMin ?? 0));
      return left > 0 ? ['Sit for {n} minutes of guided breathing.', { n: Math.min(15, left) }] : ['Done for today. Lovely.'];
    }
    case 'phone':
      if (!phone || !phone.minutes) return ['Add yesterday\'s Screen Time screenshot.'];
      return (phone.social ?? phone.minutes) > P.mediaLimit ? ['Keep social media under {n} minutes today.', { n: P.mediaLimit }] : ['Good balance yesterday. Keep it up.'];
    case 'gratitude': {
      const so = d.soul ?? {};
      if ((so.gratitude ?? []).filter(x => x?.trim()).length < 3) return ['Write three things you are thankful for.'];
      if (!d.love?.kindTo?.trim()) return ['Do one kind thing today, then write it.'];
      if (!so.laugh?.trim()) return ['Write what made you laugh today.'];
      if (!so.best?.trim()) return ['Write the best part of your day.'];
      return ['Journal complete. Read it once before sleep.'];
    }
    case 'wisdom': {
      const so = d.soul ?? {};
      if (!wisdomStudied(so)) return ['Write one line on what it means to you.'];
      return lived(so.verseLived) ? ['Lived and written. Beautiful.'] : ['Write one line on how you lived it.'];
    }
    case 'tao':
      if (!taoStudied(d.tao)) return ['Write one line on what it means to you.'];
      return lived(d.tao?.lived) ? ['Lived and written. Beautiful.'] : ['Write one line on how you lived it.'];
  }
}

/** Myra's line for a card: her latest recommendation when it is about this card, else a ready-made next step. */
export function MyraLine({ card, phone }: { card: CardId; phone?: { minutes: number; social?: number } | null }) {
  const { day, profile } = useHeal();
  const g = day.guidance, p = PILLAR[card];
  const hers = g && p && g.cards?.[p] === card ? g[p]?.[0] : undefined;
  const [text, vars] = hers ? [oneLine(hers)] : localTip(card, day, profile, phone);
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.insight + '12' }}>
      <Text style={{ color: colors.insight, fontWeight: '700' }}>✦</Text>
      <Text style={{ flex: 1, color: colors.insight, fontWeight: '600', fontSize: 13.5, lineHeight: 19 }}>{hers || card === 'face' && day.face?.tips?.[0] ? text : tr(text, vars)}</Text>
    </View>
  );
}
