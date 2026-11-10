// The missed-meal row in Food (founder, 10 Nov 2026): from 2 pm with no lunch logged, from 9:30 pm with no dinner.
// Snap opens the camera, Skipped is taken at its word (no penalty, no more nudges), Ate, no photo opens Type.

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { missedNow } from '../lib/missedMeal';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { PASTEL } from './Rings';

export function MissedMeal({ onSnap, onType }: { onSnap: () => void; onType: () => void }) {
  const { day, date, update } = useHeal();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 60_000); return () => clearInterval(t); }, []);
  const slot = date === todayISO() ? missedNow(day) : null;
  if (!slot) return null;
  const chip = (label: string, onPress: () => void, on = false) => (
    <Pressable key={label} onPress={onPress} accessibilityRole="button"
      style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 99, borderWidth: 1, borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.accent : colors.surface }}>
      <Text style={{ color: on ? '#fff' : colors.ink, fontWeight: '600', fontSize: 13.5 }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: PASTEL.sand + '22' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name="restaurant-outline" size={18} color={colors.ink} />
        <Text style={{ flex: 1, color: colors.ink, fontSize: 14.5 }}>{slot === 'lunch' ? tr('Lunch not logged') : tr('Dinner not logged')}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {chip(tr('Snap'), onSnap, true)}
        {chip(tr('Skipped'), () => update(d => { d.skipped = [...new Set([...(d.skipped ?? []), slot])]; }))}
        {chip(tr('Ate, no photo'), onType)}
      </View>
    </View>
  );
}
