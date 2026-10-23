// One tidy row per reading (founder, 21 Oct 2026: "equal space for sub elements, stacked vertically neatly").
// Label on the left, value on the right, every row the same height, a hairline between rows.
// Rows with a target show a thin bar underneath. Rows can take a typed value when no device fills them.

import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { useKeepVisible } from './ui';

export function Rows({ children }: { children: ReactNode }) {
  return <View>{children}</View>;
}

export function StatRow({ label, value, unit, target, color = colors.body, first, onEdit, decimal, right }: {
  label: string;
  value: number | string | undefined | null;
  unit?: string;
  target?: number;           // draws a thin progress bar
  color?: string;
  first?: boolean;           // no hairline above the first row
  onEdit?: (v: number | undefined) => void; // typed by hand (only where no device fills it)
  decimal?: boolean;
  right?: ReactNode;         // instead of a value (e.g. the 1–5 sleep quality buttons)
}) {
  const keep = useKeepVisible();
  const [text, setText] = useState(value == null ? '' : String(value));
  // Show the saved value once it has loaded (and after a sync), not only the value at first draw.
  useEffect(() => { setText(value == null ? '' : String(value)); }, [value]);
  const num = typeof value === 'number' ? value : undefined;
  // Only a real change counts as typed (23 Oct 2026: tapping the weight box and leaving it marked the weight as typed,
  // so the scale's new reading from Apple Health was ignored).
  const commit = () => {
    if (!onEdit) return;
    const n = parseFloat(text.replace(',', '.'));
    const next = Number.isFinite(n) ? n : undefined;
    if (next === num || (next == null && num == null)) return;
    onEdit(next);
  };
  const shown = value == null || value === '' ? '–' : typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderTopColor: colors.line, paddingVertical: 10, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 32, gap: 12 }}>
        <Text style={{ flex: 1, fontSize: 16, color: colors.ink }}>{label}</Text>
        {right ?? (onEdit ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TextInput value={text} onChangeText={setText} keyboardType={decimal ? 'decimal-pad' : 'number-pad'} placeholder="–" onFocus={() => setTimeout(keep, 300)}
              placeholderTextColor={colors.muted}
              onEndEditing={() => commit()} onBlur={() => commit()}
              style={{ width: 84, textAlign: 'right', fontSize: 16, fontWeight: '600', color: colors.ink, paddingVertical: 6, paddingHorizontal: 10,
                borderRadius: 10, backgroundColor: colors.field, borderWidth: 1, borderColor: colors.line }} />
            {unit || target ? <Text style={{ color: colors.muted, fontSize: 14, minWidth: 28 }}>{target ? `/ ${target.toLocaleString()}` : unit}</Text> : null}
          </View>
        ) : (
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, fontVariant: ['tabular-nums'] }}>
            {shown}
            {unit && shown !== '–' ? <Text style={{ fontWeight: '400', color: colors.muted }}> {unit}</Text> : null}
            {target ? <Text style={{ fontWeight: '400', color: colors.muted }}> / {target.toLocaleString()}</Text> : null}
          </Text>
        ))}
      </View>
      {target ? (
        <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.sunk, overflow: 'hidden' }}>
          <View style={{ width: `${Math.max(0, Math.min(1, (num ?? 0) / target)) * 100}%`, height: 4, backgroundColor: color }} />
        </View>
      ) : null}
    </View>
  );
}

/** 1–5 small round buttons, right-aligned, for a row such as "Sleep quality". */
export function Dots({ value, onChange }: { value?: number; onChange: (n: 1 | 2 | 3 | 4 | 5) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {([1, 2, 3, 4, 5] as const).map(n => (
        <Pressable key={n} onPress={() => onChange(n)} accessibilityRole="button" accessibilityLabel={String(n)} hitSlop={4}
          style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
            borderColor: value === n ? colors.accent : colors.line, backgroundColor: value === n ? colors.accent : colors.surface }}>
          <Text style={{ fontSize: 13, color: value === n ? colors.onAccent : colors.ink }}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}
