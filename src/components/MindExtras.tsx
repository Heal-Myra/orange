// On the Mind tab (16 Nov 2026): the weekly Focus check row and the Calm-down button (15 Nov idea 4).

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { todayISO } from '../lib/dates';
import { focusDue } from '../lib/focusGame';
import { useHeal } from '../lib/store';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

/** One small card: this week's focus and the best, or "due this week". */
export function FocusRow() {
  const { profile } = useHeal();
  const all = [...(profile.me?.focus ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const last = all[all.length - 1], best = all.length ? Math.max(...all.map(r => r.score)) : null;
  const due = focusDue(all, todayISO());
  return (
    <Pressable onPress={() => router.push('/focus')} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14, opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ fontSize: 22 }}>🎯</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{tr('Focus check')}</Text>
        <Text style={{ fontSize: 13, color: colors.muted }}>
          {last ? (due ? tr('Due this week · last {n} · best {b}', { n: last.score, b: best! }) : tr('This week {n} · best {b}', { n: last.score, b: best! })) : tr('2 minutes, once a week')}
        </Text>
        {all.length > 1 ? <Text style={{ fontSize: 12.5, color: colors.muted }}>{all.slice(-4).map(r => r.score).join(' · ')}</Text> : null}
      </View>
      <Text style={{ color: due ? colors.insight : colors.accent, fontWeight: '700' }}>{due ? tr('2 min') : tr('Again')} ›</Text>
    </Pressable>
  );
}

/** The calm-down button: one tap for a 2-minute 5-4-3-2-1 grounding. */
export function CalmButton() {
  return (
    <Pressable onPress={() => router.push('/calm')} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF4EE', borderWidth: 1, borderColor: '#F3D5C7', borderRadius: 16, padding: 12, opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ fontSize: 18 }}>🫧</Text>
      <Text style={{ flex: 1, color: colors.ink, fontWeight: '600', fontSize: 15 }}>{tr('Feeling overwhelmed?')}</Text>
      <Text style={{ color: colors.insight, fontWeight: '700' }}>{tr('2 min')} ›</Text>
    </Pressable>
  );
}
