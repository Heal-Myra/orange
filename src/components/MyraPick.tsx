// Myra's one recommendation, beside the total score on Today (founder, 31 Oct 2026; decision 0040).
// One thing only: a habit due now comes first; otherwise the step with the most points to win at this hour, with a chip
// showing how many points it can add ("+15 Mind") and Start, which opens the place where it is done.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { todayISO } from '../lib/dates';
import { habitsDue } from '../lib/habits';
import { tr } from '../lib/i18n';
import { nextStep, type Step, type StepId } from '../lib/nextStep';
import type { WellBeing } from '../lib/scoring';
import { useHeal } from '../lib/store';
import { useTasks } from '../lib/tasks';
import { colors } from '../theme';
import { PASTEL } from './Rings';

const PILLAR = { body: { label: 'Body', color: PASTEL.sage }, mind: { label: 'Mind', color: PASTEL.teal }, soul: { label: 'Soul', color: PASTEL.peach } } as const;

const say = (id: StepId, n?: number): string => ({
  sleep: tr('add how you slept last night.'),
  meditation: tr('sit for {n} minutes of guided breathing.', { n: n ?? 10 }),
  nidra: tr('lie down for Yoga Nidra, then drift into sleep.'),
  movement: tr('take a brisk 20-minute walk.'),
  food: tr('snap your next meal before you eat.'),
  tasks: tr("finish one of today's focus to-dos."),
  gratitude: tr('write what you are thankful for today.'),
  kind: tr('note one kind thing you did today.'),
  wisdom: tr("read today's Daily Wisdom and write one line."),
  tao: tr("try today's Tao practice and write one line."),
}[id]);

const start = (s: Step) => {
  if (s.id === 'meditation') router.push({ pathname: '/breathe', params: { practice: 'mix', minutes: String(s.minutes ?? 10) } });
  else if (s.id === 'nidra') router.push('/yoga-nidra');
  else router.navigate({ pathname: `/${s.pillar}`, params: { card: s.card, at: String(Date.now()) } });
};

const emailName = (email?: string | null): string | null => {
  const m = (email ?? '').split('@')[0].match(/^[a-zA-Z]+/);
  return m && m[0].length > 1 ? m[0][0].toUpperCase() + m[0].slice(1).toLowerCase() : null;
};

export function MyraPick({ w }: { w: WellBeing }) {
  const { session } = useAuth();
  const { day, date, profile } = useHeal();
  const { habits, tickHabit } = useTasks();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 60_000); return () => clearInterval(t); }, []); // the hour moves on
  const who = profile.me?.name?.trim().split(/\s+/)[0] || emailName(session?.user.email);
  const isToday = date === todayISO();
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;

  const label = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.insight, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="sparkles" size={12} color={colors.onInsight} />
      </View>
      <Text style={{ color: colors.insight, fontWeight: '700', fontSize: 10.5, letterSpacing: 0.4 }}>{tr('MYRA RECOMMENDS')}</Text>
    </View>
  );
  const line = (text: string) => (
    <Text style={{ color: colors.ink, fontSize: 15, lineHeight: 21 }}>{who ? <Text style={{ fontWeight: '700' }}>{who}, </Text> : null}{who ? text : text.charAt(0).toUpperCase() + text.slice(1)}</Text>
  );

  if (!isToday) return <View style={{ flex: 1 }}><Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>{tr('A look back at this day. Tap the circles below to see each part.')}</Text></View>;

  // A habit at its time comes first (founder, 23 Oct 2026), ticked right here.
  const habit = habitsDue(habits, day.habitsDone ?? [])[0];
  if (habit) {
    return (
      <View style={{ flex: 1, gap: 8 }}>
        {label}
        {line(habit.title)}
        <Pressable onPress={() => tickHabit(habit.id)} accessibilityRole="checkbox" accessibilityLabel={`${tr('Done')}: ${habit.title}`} hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="ellipse-outline" size={20} color={colors.insight} />
          <Text style={{ color: colors.insight, fontWeight: '700', fontSize: 13 }}>{tr('Done')}</Text>
        </Pressable>
      </View>
    );
  }

  const s = nextStep(day, profile, w, hour);
  if (!s) return <View style={{ flex: 1, gap: 8 }}>{label}{line(tr('a full day. Rest well.'))}</View>;
  const p = PILLAR[s.pillar];
  return (
    <Pressable onPress={() => start(s)} accessibilityRole="button" accessibilityHint={tr('Opens the card where you do this')}
      style={({ pressed }) => ({ flex: 1, gap: 8, opacity: pressed ? 0.8 : 1 })}>
      {label}
      {line(say(s.id, s.minutes))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ backgroundColor: p.color + '33', borderRadius: 99, paddingVertical: 4, paddingHorizontal: 9 }}>
          <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 12 }}>+{s.gain} {tr(p.label)}</Text>
        </View>
        <Text style={{ color: colors.insight, fontWeight: '700', fontSize: 13 }}>{tr('Start')} ›</Text>
      </View>
    </Pressable>
  );
}
