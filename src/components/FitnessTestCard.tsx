// Monthly fitness test in the Body card (founder, 16 Nov 2026 idea 5): on the 1st (with Measure day) a "Start" button;
// after a test, last month against this month with new bests; between tests, one small row.

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { todayISO } from '../lib/dates';
import { TESTS, fitnessLine, fmtResult, lastTwo, testDue } from '../lib/fitnessTest';
import { useHeal } from '../lib/store';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

export function FitnessTestCard() {
  const { profile, date } = useHeal();
  const all = profile.me?.fitness;
  if (!profile.me) return null;
  const today = todayISO();
  const due = date === today && testDue(all, today);
  const { now, was, bests } = lastTwo(all);
  const fresh = now && now.date.slice(0, 7) === today.slice(0, 7);
  // Done this month: the results show on the day of the test only, then wait for the 1st (founder, 16 Nov 2026).
  if (now && !due && now.date !== today) return null;
  const start = (
    <Pressable onPress={() => router.push('/fitness-test')} accessibilityRole="button"
      style={{ marginTop: 6, borderRadius: 12, paddingVertical: 11, alignItems: 'center', backgroundColor: colors.accent }}>
      <Text style={{ color: '#fff', fontWeight: '600' }}>{tr("Start this month's test")}</Text>
    </Pressable>
  );
  if (due) return (
    <View style={{ gap: 2, marginTop: 8, padding: 12, borderRadius: 14, backgroundColor: colors.bg }}>
      <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 16 }}>{tr('Fitness test')} 💪</Text>
      <Text style={{ color: colors.muted, fontSize: 13 }}>{tr("Once a month, 5 minutes. Beat your own best, no one else's.")}</Text>
      {start}
    </View>
  );
  if (!now) return (
    <Pressable onPress={() => router.push('/fitness-test')} accessibilityRole="button" style={{ flexDirection: 'row', paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Text style={{ flex: 1, color: colors.ink, fontSize: 15 }}>💪 {tr('Fitness test')}</Text>
      <Text style={{ color: colors.accent, fontWeight: '600' }}>{tr('Take it now')} ›</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 2, marginTop: 6 }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginTop: 4 }}>💪 {tr('FITNESS TEST')}</Text>
      {TESTS.map(t => (
        <View key={t.id} style={{ flexDirection: 'row', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line }}>
          <Text style={{ flex: 1, color: colors.ink, fontSize: 14.5 }}>{tr(t.name)}</Text>
          <Text style={{ color: colors.ink, fontSize: 14.5 }}>{was ? `${fmtResult(t.id, was[t.id])} → ` : ''}<Text style={{ fontWeight: '700', color: bests.includes(t.id) ? colors.good : colors.ink }}>{fmtResult(t.id, now[t.id])}</Text></Text>
        </View>
      ))}
      {fresh ? <Text style={{ color: colors.insight, fontSize: 14, marginTop: 4 }}>✦ {tr(...fitnessLine(bests.length, !was))}</Text> : null}
      <Pressable onPress={() => router.push('/fitness-test')} hitSlop={6}><Text style={{ color: colors.muted, fontSize: 12.5 }}>{tr('Next test on the 1st · take it again')}</Text></Pressable>
    </View>
  );
}
