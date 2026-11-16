// On the Soul tab (16 Nov 2026): the weekly Forgiveness practice (15 Nov idea 6) and, on Sunday evening and Monday,
// the Sunday voice reflection (15 Nov idea 5) with the lines Myra wrote.

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { shiftISO, todayISO } from '../lib/dates';
import { FORGIVE_PTS } from '../lib/scoring';
import { useHeal } from '../lib/store';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

export function SoulExtras() {
  const { days, day, date } = useHeal();
  const today = todayISO();
  const isToday = date === today;
  const doneThisWeek = Object.keys(days).some(k => k <= date && k > shiftISO(date, -7) && days[k]?.soul?.forgave);
  const wd = new Date().getDay(), h = new Date().getHours();
  const sundayTime = isToday && ((wd === 0 && h >= 17) || wd === 1);
  const r = day.soul?.reflection;
  // Weekly items, once done, stay out of sight for the rest of the week (founder, 16 Nov 2026).
  const showLetGo = !doneThisWeek;
  const showReflect = sundayTime && !r && !Object.keys(days).some(k => k <= date && k > shiftISO(date, -7) && days[k]?.soul?.reflection);
  if (!showLetGo && !showReflect) return null;
  const row = (icon: string, title: string, sub: string, right: string, go: () => void, first = false, rightColor: string = colors.accent) => (
    <Pressable onPress={go} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line, opacity: pressed ? 0.8 : 1 })}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{title}</Text>
        <Text style={{ fontSize: 13, color: colors.muted }}>{sub}</Text>
      </View>
      <Text style={{ color: rightColor, fontWeight: '700' }}>{right}</Text>
    </Pressable>
  );
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 4 }}>
      {showLetGo ? row('🕊', tr('Letting go'), tr('5 minutes, once a week · +{n} Soul', { n: FORGIVE_PTS }), `${tr('Begin')} ›`, () => router.push('/forgive'), true, colors.insight) : null}
      {showReflect ? row('🎙', tr('Your week, in your words'), tr('Speak for 2 minutes; Myra writes it down'), `${tr('Speak')} ›`, () => router.push('/reflect'), !showLetGo, colors.insight) : null}
    </View>
  );
}
