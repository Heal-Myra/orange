// Small building blocks shared by every screen.

import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDay, todayISO } from '../lib/dates';
import { useHeal } from '../lib/store';
import { FeedbackBox } from './FeedbackBox';
import { colors, radius, shadow, space } from '../theme';

export function Screen({ children, showDay = true, feedback, top }: { children: ReactNode; showDay?: boolean; feedback?: string; top?: ReactNode }) {
  return (
    <SafeAreaView style={s.safe} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {top}
        {showDay && <DayBar />}
        {feedback ? <FeedbackBox area={feedback} /> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function DayBar() {
  const { date, goDay } = useHeal();
  const isToday = date === todayISO();
  return (
    <View style={s.dayBar}>
      <Pressable accessibilityLabel="Previous day" onPress={() => goDay(-1)} style={s.dayBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.muted} />
      </Pressable>
      <Text style={s.dayText}>{formatDay(date)}</Text>
      <Pressable accessibilityLabel="Next day" onPress={() => goDay(1)} style={[s.dayBtn, isToday && { opacity: 0.3 }]} disabled={isToday} hitSlop={8}>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Heading({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={s.headingRow}>
      <Text style={s.heading}>{children}</Text>
      {right}
    </View>
  );
}

export const Note = ({ children }: { children: ReactNode }) => <Text style={s.note}>{children}</Text>;
export const Label = ({ children }: { children: ReactNode }) => <Text style={s.label}>{children}</Text>;

export function Score({ value, max }: { value: number | null | undefined; max: number }) {
  return (
    <Text style={s.score}>
      {value == null ? '–' : Math.round(value)}
      <Text style={s.scoreMax}> /{max}</Text>
    </Text>
  );
}

export function Meter({ label, value, max, color, right }: { label: string; value: number; max: number; color: string; right?: string }) {
  const pct = max ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <View style={{ gap: 4 }}>
      <View style={s.headingRow}>
        <Text style={s.meterLabel}>{label}</Text>
        <Text style={s.meterRight}>{right ?? `${Math.round(value)} / ${max}`}</Text>
      </View>
      <View style={s.track}><View style={[s.fill, { width: `${pct}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

export function NumberField({ label, value, onChange, placeholder, decimal }: {
  label: string; value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string; decimal?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        defaultValue={value == null ? '' : String(value)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        onEndEditing={e => {
          const n = parseFloat(e.nativeEvent.text);
          onChange(Number.isFinite(n) ? n : undefined);
        }}
      />
    </View>
  );
}

export function TextField({ label, value, onChangeText, placeholder, multiline }: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; multiline?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput style={[s.input, multiline && { minHeight: 70, textAlignVertical: 'top' }]} value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor={colors.muted} multiline={multiline} />
    </View>
  );
}

export function Check({ checked, onToggle, title, detail, points, color = colors.soul, tag }: {
  checked: boolean; onToggle: () => void; title: string; detail?: string; points?: number; color?: string; tag?: string;
}) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onToggle}
      style={[s.check, checked && { borderColor: color, backgroundColor: color + '14' }]}>
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={22} color={checked ? color : colors.muted} />
      <View style={{ flex: 1 }}>
        <Text style={s.checkTitle}>{title}{tag ? <Text style={[s.tag, { color }]}>  {tag}</Text> : null}</Text>
        {detail ? <Text style={s.checkDetail}>{detail}</Text> : null}
      </View>
      {points != null && <Text style={s.points}>{points}</Text>}
    </Pressable>
  );
}

export function Button({ title, onPress, kind = 'primary', disabled }: { title: string; onPress: () => void; kind?: 'primary' | 'plain' | 'insight'; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={({ pressed }) => [s.btn, kind === 'primary' ? s.btnPrimary : kind === 'insight' ? s.btnInsight : s.btnPlain, (pressed || disabled) && { opacity: 0.6 }]}>
      <Text style={[s.btnText, kind !== 'plain' && { color: colors.onAccent }]}>{title}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T | undefined; onChange: (v: T) => void }) {
  return (
    <View style={s.seg}>
      {options.map(o => (
        <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[s.segBtn, o.value === value && s.segOn]}>
          <Text style={[s.segText, o.value === value && { color: colors.onAccent }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: 120 }, // room for the Myra button
  dayBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md },
  dayBtn: { padding: space.sm },
  dayText: { fontSize: 16, fontWeight: '600', color: colors.ink, minWidth: 130, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg + 4, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.md, boxShadow: shadow },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  heading: { fontSize: 20, fontWeight: '600', color: colors.ink, flexShrink: 1 },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  label: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted, fontWeight: '700' },
  score: { fontSize: 20, fontVariant: ['tabular-nums'], color: colors.insight }, // scores are Happy Orange output
  scoreMax: { fontSize: 13, color: colors.muted },
  meterLabel: { fontSize: 14, color: colors.ink },
  meterRight: { fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 99, backgroundColor: colors.sunk, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  field: { gap: 4, flex: 1, minWidth: 120 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.muted },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 9, fontSize: 16, color: colors.ink, backgroundColor: colors.field },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: space.md, backgroundColor: colors.surface },
  checkTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  checkDetail: { fontSize: 13, color: colors.muted },
  tag: { fontSize: 11, fontWeight: '700' },
  points: { fontSize: 14, color: colors.muted, fontVariant: ['tabular-nums'] },
  btn: { borderRadius: 99, paddingVertical: 11, paddingHorizontal: 16, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.accent },
  btnInsight: { backgroundColor: colors.insight }, // suggestions and analytics
  btnPlain: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  btnText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  seg: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, overflow: 'hidden', alignSelf: 'flex-start' },
  segBtn: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.surface },
  segOn: { backgroundColor: colors.accent },
  segText: { fontSize: 14, color: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
});
