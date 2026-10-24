// A small month calendar for to-dos (founder, 24 Oct 2026: "let user choose date from calendar also").
// Plain app code, so it works on every build and on the website. Past days are off; full days (3 to-dos in the group)
// are shown greyed with a small "3".

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { isoDate, todayISO } from '../lib/dates';
import { locale } from '../lib/i18n';
import { colors } from '../theme';

export function DatePicker({ value, onPick, full }: { value?: string; onPick: (iso: string) => void; full?: (iso: string) => boolean }) {
  const today = todayISO();
  const start = value ?? today;
  const [ym, setYm] = useState(() => { const [y, m] = start.split('-').map(Number); return { y, m: m - 1 }; });
  const first = new Date(ym.y, ym.m, 1);
  const lead = (first.getDay() + 6) % 7; // weeks start on Monday
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => isoDate(new Date(ym.y, ym.m, i + 1)))];
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 19 + i).toLocaleDateString(locale(), { weekday: 'narrow' }));
  const move = (n: number) => setYm(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const canBack = ym.y > Number(today.slice(0, 4)) || (ym.y === Number(today.slice(0, 4)) && ym.m > Number(today.slice(5, 7)) - 1);

  return (
    <View style={{ gap: 6, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => canBack && move(-1)} hitSlop={10} style={{ opacity: canBack ? 1 : 0.3 }}><Ionicons name="chevron-back" size={20} color={colors.muted} /></Pressable>
        <Text style={{ fontWeight: '600', color: colors.ink }}>{first.toLocaleDateString(locale(), { month: 'long', year: 'numeric' })}</Text>
        <Pressable onPress={() => move(1)} hitSlop={10}><Ionicons name="chevron-forward" size={20} color={colors.muted} /></Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((w, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12, color: colors.muted }}>{w}</Text>)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((iso, i) => {
          if (!iso) return <View key={i} style={{ width: `${100 / 7}%`, height: 40 }} />;
          const past = iso < today, isFull = !past && !!full?.(iso), on = iso === value;
          return (
            <Pressable key={i} disabled={past || isFull} onPress={() => onPick(iso)} accessibilityLabel={iso}
              style={{ width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                backgroundColor: on ? colors.accent : iso === today ? colors.accent + '14' : 'transparent' }}>
                <Text style={{ color: on ? colors.onAccent : past || isFull ? colors.muted : colors.ink, opacity: past ? 0.35 : isFull ? 0.5 : 1, fontWeight: iso === today ? '700' : '400' }}>
                  {Number(iso.slice(8))}
                </Text>
                {isFull ? <Text style={{ position: 'absolute', bottom: -2, fontSize: 9, color: colors.muted }}>3</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
