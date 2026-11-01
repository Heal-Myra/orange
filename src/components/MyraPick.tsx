// Myra's one recommendation, beside the total score on Today (founder, 31 Oct 2026; decision 0040).
// One thing only: a habit due now comes first; otherwise the step with the most points to win at this hour, shown impact
// first (founder's option 5): "+30 / Mind points / from 20 min Yoga Nidra ›". Tapping opens the place where it is done.

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
import { HandLine } from './HandLine';

// The big number takes a deeper shade of its pillar's ring colour so it reads well (never red).
const PILLAR = {
  body: { points: 'Body · for your day', ink: '#5E8A4E' },
  mind: { points: 'Mind · for your day', ink: '#2A7C83' },
  soul: { points: 'Soul · for your day', ink: '#A9744F' },
} as const;

/** One line in an instructing tone (founder, 31 Oct 2026, like option 3): a nudge, no minutes. */
const what = (id: StepId): string => ({
  sleep: tr("Log last night's sleep."),
  meditation: tr('Sit and breathe.'),
  nidra: tr('Lie down for Yoga Nidra.'),
  movement: tr('Go for a brisk walk.'),
  food: tr('Snap your next meal.'),
  tasks: tr('Finish one to-do.'),
  gratitude: tr('Write your gratitude.'),
  kind: tr('Note one kind act.'),
  wisdom: tr("Read today's wisdom."),
  tao: tr("Try today's Tao."),
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
  const [readyFor, setReadyFor] = useState(''); // the start arrow shows once the quill has finished this line
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
  // Impact first (founder, 31 Oct 2026): the points in large, then one instructing line and a round Start now arrow (option 3).
  const p = PILLAR[s.pillar];
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ color: p.ink, fontSize: 40, fontWeight: '800', lineHeight: 44 }}>+{Math.max(1, Math.round(s.gain / 3))}</Text>
      <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>{tr(p.points)}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
        {/* Written by a quill, then the start arrow appears (founder, 31 Oct 2026). */}
        <View style={{ flex: 1 }}><HandLine text={what(s.id)} style={{ color: colors.ink, fontSize: 19, lineHeight: 24 }} onDone={() => setReadyFor(what(s.id))} /></View>
        <Pressable onPress={() => start(s)} accessibilityRole="button" accessibilityLabel={`${tr('Start now')}: ${what(s.id)}`} hitSlop={8}
          style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.insight, alignItems: 'center', justifyContent: 'center', opacity: readyFor !== what(s.id) ? 0 : pressed ? 0.85 : 1 })}>
          <Ionicons name="arrow-forward" size={20} color={colors.onInsight} />
        </Pressable>
      </View>
    </View>
  );
}
