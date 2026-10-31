// Small building blocks shared by every screen.

import { useAttach, type Picked } from './AttachPlus';
import { readNoteText } from '../lib/ai';
import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDay, todayISO } from '../lib/dates';
import { useHeal } from '../lib/store';
import { FeedbackBox } from './FeedbackBox';
import { RangeBar, Trends } from './Trends';
import { useRange } from '../lib/range';
import type { Pillar } from '../lib/trends';
import { colors, radius, shadow, space } from '../theme';
import { tr } from '../lib/i18n';

// Jump to a card: Today's "Myra recommends" opens a tab with ?card=<id> and the screen scrolls to that card and
// outlines it for a moment (founder, 21 Oct 2026). Cards opt in by being wrapped in <Anchor id="…">.
const AnchorCtx = createContext<{ register: (id: string, y: number) => void; lit: string | null; keepVisible: () => void }>({ register: () => {}, lit: null, keepVisible: () => {} });

export function Screen({ children, showDay = true, feedback, top, trends }: { children: ReactNode; showDay?: boolean; feedback?: string; top?: ReactNode; trends?: Pillar }) {
  const { range } = useRange();
  const trending = !!trends && range !== 'D';
  const { card, at } = useLocalSearchParams<{ card?: string; at?: string }>();
  const scroll = useRef<ScrollViewInstance>(null);
  const spots = useRef<Record<string, number>>({});
  const [lit, setLit] = useState<string | null>(null);
  const jumped = useRef('');
  const jump = useCallback(() => {
    const key = `${card}|${at}`;
    if (!card || jumped.current === key || spots.current[card] == null) return;
    jumped.current = key;
    scroll.current?.scrollTo({ y: Math.max(0, spots.current[card] - 12), animated: true });
    setLit(card);
    setTimeout(() => setLit(l => (l === card ? null : l)), 1800);
  }, [card, at]);
  useEffect(() => { const t = setTimeout(jump, 250); return () => clearTimeout(t); }, [jump]);
  const register = useCallback((id: string, y: number) => { spots.current[id] = y; if (id === card) jump(); }, [card, jump]);

  // The box being typed in always stays above the keyboard (founder, 21 Oct 2026: on iPhone the keyboard covered it).
  // When the keyboard opens, and whenever a growing box gets taller, scroll just enough to show its bottom edge.
  const offset = useRef(0);
  const kbTop = useRef<number | null>(null);
  const keepVisible = useCallback(() => {
    if (Platform.OS === 'web' || typeof TextInput.State?.currentlyFocusedInput !== 'function') return; // browsers handle this themselves
    const input = TextInput.State.currentlyFocusedInput() as unknown as { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void } | null;
    const top = kbTop.current;
    if (!input?.measureInWindow || top == null) return;
    input.measureInWindow((_x, y, _w, h) => {
      const overlap = y + h + 16 - top;
      if (overlap > 0) scroll.current?.scrollTo({ y: offset.current + overlap, animated: true });
    });
  }, []);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Keyboard.addListener('keyboardDidShow', e => { kbTop.current = e.endCoordinates.screenY; setTimeout(keepVisible, 30); });
    const hide = Keyboard.addListener('keyboardDidHide', () => { kbTop.current = null; });
    return () => { show.remove(); hide.remove(); };
  }, [keepVisible]);
  const ctx = useMemo(() => ({ register, lit, keepVisible }), [register, lit, keepVisible]);
  return (
    <SafeAreaView style={s.safe} edges={['left', 'right']}>
      <AnchorCtx.Provider value={ctx}>
        <ScrollView ref={scroll} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets keyboardDismissMode="interactive" scrollEventThrottle={32}
          onScroll={e => { offset.current = e.nativeEvent.contentOffset.y; }}>
          {/* Day · Week · Month · Quarter · Year (founder, 22 Oct 2026): any other choice than Day shows the tab's trends. */}
          {trends ? <RangeBar /> : null}
          {trending ? <Trends pillar={trends} /> : <>
            {top}
            {showDay && <DayBar />}
            {feedback ? <FeedbackBox area={feedback} /> : null}
            {children}
          </>}
        </ScrollView>
      </AnchorCtx.Provider>
    </SafeAreaView>
  );
}

/** For text boxes outside TextField: call on focus / growth so the box stays above the keyboard. */
export const useKeepVisible = () => useContext(AnchorCtx).keepVisible;

/** A card the Today screen can jump to. Must be a direct child of <Screen>. */
export function Anchor({ id, children }: { id: string; children: ReactNode }) {
  const { register, lit } = useContext(AnchorCtx);
  return (
    <View onLayout={e => register(id, e.nativeEvent.layout.y)}
      style={{ borderRadius: radius.lg + 4, borderWidth: 2, borderColor: lit === id ? colors.insight : 'transparent', margin: -2 }}>
      {children}
    </View>
  );
}

export function DayBar() {
  const { date, goDay } = useHeal();
  const isToday = date === todayISO();
  return (
    <View style={s.dayBar}>
      <Pressable accessibilityLabel={tr('Previous day')} onPress={() => goDay(-1)} style={s.dayBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.muted} />
      </Pressable>
      <Text style={s.dayText}>{formatDay(date)}</Text>
      <Pressable accessibilityLabel={tr('Next day')} onPress={() => goDay(1)} style={[s.dayBtn, isToday && { opacity: 0.3 }]} disabled={isToday} hitSlop={8}>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>
    </View>
  );
}

/**
 * Design rule (founder, 23 Oct 2026): anything optional folds away inside the card of the section it belongs to.
 * One small row (icon, name, one-line status); tap to open the details, tap again to fold them away.
 */
export function Expandable({ icon, title, status, statusColor, color = colors.accent, open: controlled, defaultOpen = false, onToggle, children }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; status?: string; statusColor?: string; color?: string;
  open?: boolean; defaultOpen?: boolean; onToggle?: (open: boolean) => void; children: ReactNode;
}) {
  const [own, setOwn] = useState(defaultOpen);
  const open = controlled ?? own;
  const toggle = () => { setOwn(!open); onToggle?.(!open); };
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
      <Pressable onPress={toggle} accessibilityRole="button" accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
        <Ionicons name={icon} size={22} color={color} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: colors.ink }}>{title}</Text>
          {status ? <Text style={{ fontSize: 13, color: statusColor ?? colors.muted }} numberOfLines={1}>{status}</Text> : null}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {open ? <View style={{ gap: 10, paddingBottom: 12 }}>{children}</View> : null}
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

export function NumberField({ label, value, onChange, placeholder, decimal, live }: {
  label: string; value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string; decimal?: boolean;
  live?: boolean; // report every keystroke (forms that show a result as you type), not only when typing ends
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
        onChangeText={live ? t => { const n = parseFloat(t.replace(',', '.')); onChange(Number.isFinite(n) ? n : undefined); } : undefined}
        onEndEditing={e => {
          const n = parseFloat(e.nativeEvent.text);
          onChange(Number.isFinite(n) ? n : undefined);
        }}
      />
    </View>
  );
}

export function TextField({ label, value, onChangeText, placeholder, multiline, attach, onPhoto, photoHint, front }: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; multiline?: boolean;
  attach?: boolean; // "+" to read a photo into the box (founder, 30 Oct 2026); on for every writing box (multiline) unless false
  onPhoto?: (img: Picked) => Promise<string | null | void>; // a box's own way of reading the photo (e.g. a selfie)
  photoHint?: string; front?: boolean;
}) {
  const { keepVisible } = useContext(AnchorCtx);
  const plus = useAttach(async img => {
    if (onPhoto) return onPhoto(img);
    const r = await readNoteText(img.data, img.media_type, label);
    const t = (r.text ?? '').trim();
    if (!t) return tr('No words found in that photo. Try a clearer one.');
    onChangeText(value.trim() ? `${value.trim()} ${t}` : t);
    return null;
  }, { size: 40, hint: photoHint, front });
  const withPlus = attach ?? !!multiline;
  const box = (
    <TextInput style={[s.input, multiline && { minHeight: 70, textAlignVertical: 'top' }, withPlus && { flex: 1, minWidth: 0 }]} value={value} onChangeText={onChangeText}
      placeholder={placeholder} placeholderTextColor={colors.muted} multiline={multiline}
      onFocus={() => setTimeout(keepVisible, 300)} onContentSizeChange={multiline ? () => keepVisible() : undefined} />
  );
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {withPlus && plus.button ? <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>{box}{plus.button}</View> : box}
      {withPlus ? plus.status : null}
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
