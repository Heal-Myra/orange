// Small building blocks shared by every screen.

import { useAttach, type Picked } from './AttachPlus';
import { readNoteText } from '../lib/ai';
import { Ionicons } from '@expo/vector-icons';
import { createContext, isValidElement, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDay, todayISO } from '../lib/dates';
import { useHeal } from '../lib/store';
import { FeedbackBox } from './FeedbackBox';
import type { Pillar } from '../lib/trends';
import { GlassBackdrop } from './GlassBackdrop';
import { SECTION, sectionOf } from '../lib/livingColour';
import { CARD_TINT, DEFAULT_TINT, colors, font, glass, isGlass, isLight, radius, shadow, space, statusColor } from '../theme';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { lang, tr } from '../lib/i18n';

// Jump to a card: Today's "Myra recommends" opens a tab with ?card=<id> and the screen scrolls to that card and
// outlines it for a moment (founder, 21 Oct 2026). Cards opt in by being wrapped in <Anchor id="…">.
const AnchorCtx = createContext<{ register: (id: string, y: number) => void; lit: string | null; keepVisible: () => void }>({ register: () => {}, lit: null, keepVisible: () => {} });

/** A tab's standard header height: 44 on iPhone, 56 on Android, 64 on the web, plus the status bar. */
export const tabHeaderHeight = (top: number) => top + (Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 56 : 64);

export function Screen({ children, showDay = false, feedback, top, dayLabel, noBanner, fill }: { children: ReactNode; showDay?: boolean; noBanner?: boolean; feedback?: string; top?: ReactNode; trends?: Pillar; dayLabel?: ReactNode; fill?: boolean }) {
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
  // Tabs have a see-through header in the glass looks: Body, Mind and Soul start below it (Today's scene handles itself).
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const under = isGlass && (path === '/body' || path === '/mind' || path === '/soul' || (isLight && path === '/spaces')) ? tabHeaderHeight(insets.top) : 0;
  return (
    <SafeAreaView style={s.safe} edges={['left', 'right']}>
      <GlassBackdrop />
      <AnchorCtx.Provider value={ctx}>
        <ScrollView ref={scroll} contentContainerStyle={[fill ? [s.scroll, { flexGrow: 1, gap: space.md, paddingTop: space.md, paddingBottom: space.md }] : s.scroll, under ? { paddingTop: under + space.md } : null]} keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets keyboardDismissMode="interactive" scrollEventThrottle={32}
          onScroll={e => { offset.current = e.nativeEvent.contentOffset.y; }}>
          {/* Trends moved off the tabs (founder, 31 Oct 2026): D · W · M · Q · Y lives on each card's detail page
              (tap the rings; src/app/trend.tsx), so people not interested in trends never see the switch. */}
          {top}
          {/* No day row on the tabs (founder, 31 Oct 2026): they show today. A past day is opened from a card's
              Trends page (D); then a slim banner says which day it is and leads back to today. */}
          {showDay ? <DayBar label={dayLabel} /> : noBanner ? null : <PastDayBanner />}
          {feedback ? <FeedbackBox area={feedback} /> : null}
          {children}
        </ScrollView>
      </AnchorCtx.Provider>
    </SafeAreaView>
  );
}

/** Shown only when a past day is open on the tabs. */
function PastDayBanner() {
  const { date, setDate } = useHeal();
  if (date === todayISO()) return null;
  return (
    <Pressable onPress={() => setDate(todayISO())} accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, backgroundColor: colors.tint }}>
      <Ionicons name="calendar-outline" size={18} color={colors.accent} />
      <Text style={{ flex: 1, color: colors.ink }}>{tr('Showing {day}', { day: formatDay(date) })}</Text>
      <Text style={{ color: colors.accent, fontWeight: '700' }}>{tr('Back to today')}</Text>
    </Pressable>
  );
}

/** For text boxes outside TextField: call on focus / growth so the box stays above the keyboard. */
export const useKeepVisible = () => useContext(AnchorCtx).keepVisible;

/** A card the Today screen can jump to. Must be a direct child of <Screen>. */
const TintCtx = createContext<string | null>(null);
// Is this card inside another card? Top-level cards run edge to edge in the glass look (founder, 19 Nov 2026: like Oura,
// no gap between the card and the screen's sides); cards inside cards keep their place.
const InCardCtx = createContext(false);

export function Anchor({ id, children }: { id: string; children: ReactNode }) {
  const { register, lit } = useContext(AnchorCtx);
  return (
    <View onLayout={e => register(id, e.nativeEvent.layout.y)}
      style={{ borderRadius: radius.lg + 4, borderWidth: 2, borderColor: lit === id ? colors.insight : 'transparent', margin: -2 }}>
      <TintCtx.Provider value={id}>{children}</TintCtx.Provider>
    </View>
  );
}

export function DayBar({ label }: { label?: ReactNode } = {}) {
  const { date, goDay } = useHeal();
  const isToday = date === todayISO();
  return (
    <View style={s.dayBar}>
      <Pressable accessibilityLabel={tr('Previous day')} onPress={() => goDay(-1)} style={s.dayBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.muted} />
      </Pressable>
      {isToday && label ? <View style={{ flex: 1, alignItems: 'center' }}>{label}</View> : <Text style={s.dayText}>{formatDay(date)}</Text>}
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

/** A card. In the glass look each card carries its own soft colour wash that fades into the dark (Oura-like): the tint
 *  comes from `tint`, else from its Anchor id (CARD_TINT), else a calm slate. */
export function Card({ children, style, tint }: { children: ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  const anchor = useContext(TintCtx);
  const gid = 'g' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const path = usePathname();
  // Pastel look: every card on a screen takes that screen's own colour, so the page reads as one (founder, 20 Nov 2026).
  const t = tint && !isLight ? tint : isLight ? SECTION[sectionOf(path)].tab : (anchor ? CARD_TINT[anchor] : undefined) ?? DEFAULT_TINT;
  const nested = useContext(InCardCtx);
  // The wash is drawn at the card's measured size: "100%" inside an edge-to-edge card left a dark strip on iPhone (19 Nov 2026).
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  return (
    <InCardCtx.Provider value>
    <View onLayout={isGlass ? e => { const { width: w, height: h } = e.nativeEvent.layout; if (!box || Math.abs(box.w - w) > 0.5 || Math.abs(box.h - h) > 0.5) setBox({ w, h }); } : undefined}
      style={[s.card, isGlass && { overflow: 'hidden' }, isGlass && !nested && { marginHorizontal: -space.lg, paddingHorizontal: space.lg + 6, paddingVertical: space.lg + 6 }, style]}>
      {isGlass && box ? (
        <Svg pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }} width={box.w} height={box.h}>
          <Defs>
            <SvgLinearGradient id={gid} x1="0" y1="0" x2="0.35" y2="1">
              <Stop offset="0" stopColor={t} stopOpacity={isLight ? 0.2 : 0.34} />
              <Stop offset="0.55" stopColor={t} stopOpacity={isLight ? 0.05 : 0.09} />
              <Stop offset="1" stopColor={t} stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width={box.w} height={box.h} fill={`url(#${gid})`} />
        </Svg>
      ) : null}
      {children}
    </View>
    </InCardCtx.Provider>
  );
}

/** Each section's icon in the one card header (decision 0063), keyed by the card's anchor id. */
const CARD_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant-outline', sleep: 'moon-outline', movement: 'walk-outline', body: 'body-outline', tasks: 'checkmark-done-outline',
  focus: 'eye-outline', meditation: 'flower-outline', phone: 'phone-portrait-outline', gratitude: 'heart-outline', love: 'heart-circle-outline',
  wisdom: 'book-outline', tao: 'leaf-outline', letgo: 'cloud-outline',
};

/** Cards with no big score of their own below the heading keep the score in the heading. */
const OWN_SCORE_IN_HEAD = new Set(['meditation', 'phone', 'love']);

export function Heading({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const anchor = useContext(TintCtx);
  // Glass look: a scored card's heading becomes the one card header (icon, name, coloured band word); the score itself
  // shows large just below (RingPanel / RingTop), so it is not repeated here.
  if (isGlass && anchor && CARD_ICON[anchor]) {
    const sc = isValidElement<{ value?: number | null; max: number }>(right) && right.type === Score ? right.props : null;
    const pct = sc && sc.value != null && sc.max ? (sc.value / sc.max) * 100 : null;
    const b = pct == null ? undefined : pct >= 80 ? 'Flourishing' : pct >= 60 ? 'Balanced' : pct >= 40 ? 'Finding your footing' : 'Needs care';
    return <CardHead icon={CARD_ICON[anchor]} title={typeof children === 'string' ? children : String(children ?? '')} status={b ? tr(b) : sc ? tr('Not yet scored') : undefined} band={b} right={sc && !OWN_SCORE_IN_HEAD.has(anchor) ? undefined : right} />;
  }
  return (
    <View style={s.headingRow}>
      <Text style={s.heading}>{children}</Text>
      {right}
    </View>
  );
}

/** The serif voice: Myra's and the masters' words, and the one band word (Oura-like redesign, decision 0063). */
export function Serif({ children, size = 26, color = colors.ink, style, lines }: { children: ReactNode; size?: number; color?: string; style?: StyleProp<import('react-native').TextStyle>; lines?: number }) {
  const hi = lang() === 'hi';
  return <Text numberOfLines={lines} style={[{ fontFamily: isGlass ? font.serif(lang()) : undefined, fontSize: hi ? size * 0.82 : size, lineHeight: (hi ? size * 0.82 : size) * (hi ? 1.45 : 1.12), color }, style]}>{children}</Text>;
}

/** A big, thin number with an optional small unit (Oura's "78 bpm"). */
export function BigNum({ value, unit, size = 40 }: { value: ReactNode; unit?: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, fontWeight: isGlass ? font.thin : '700', color: colors.ink, fontVariant: ['tabular-nums'], lineHeight: size * 1.1 }}>
      {value}{unit ? <Text style={{ fontSize: size * 0.4, fontWeight: font.light, color: colors.muted }}> {unit}</Text> : null}
    </Text>
  );
}

/** The one card header (decision 0063): icon in a soft circle, the name, the coloured status word in spaced capitals,
 *  and a chevron when it opens something. `band` colours the status (statusColor); `status` alone stays muted. */
export function CardHead({ icon, title, status, band, onPress, right }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; status?: string; band?: string; onPress?: () => void; right?: ReactNode;
}) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {icon ? <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={20} color={colors.ink} /></View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 18, fontWeight: '500', color: colors.ink }} numberOfLines={1}>{title}</Text>
        {status ? <Text style={[s.status, { color: band ? statusColor(band) : colors.muted }]} numberOfLines={1}>{status}</Text> : null}
      </View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={20} color={colors.ink} /> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" hitSlop={6}>{body}</Pressable> : body;
}

/** A small key-number tile (Oura's "Key metrics"): spaced-capital label above a light number. */
export function Tile({ label, value, onPress }: { label: string; value: ReactNode; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={{ flex: 1, minWidth: 130, backgroundColor: colors.field, borderRadius: 20, padding: 14, gap: 4 }}>
      <Text style={s.label} numberOfLines={2}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: font.light, color: colors.ink }} numberOfLines={1}>{value}</Text>
    </Pressable>
  );
}

export const Note = ({ children }: { children: ReactNode }) => <Text style={s.note}>{children}</Text>;
export const Label = ({ children }: { children: ReactNode }) => <Text style={s.label}>{children}</Text>;

/** The card's score as a soft pill at the top right (decision 0037: one look for every scored card). */
export function Score({ value, max }: { value: number | null | undefined; max: number }) {
  const v = value == null ? '–' : Number.isInteger(value * 2) ? value : Math.round(value);
  return (
    <View style={isGlass ? { paddingHorizontal: 2 } : { backgroundColor: colors.tint, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={s.score}>
        {v}
        <Text style={s.scoreMax}>/{max}</Text>
      </Text>
    </View>
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
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
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
      <Text style={[s.btnText, kind !== 'plain' && { color: isGlass ? colors.ink : colors.onAccent }]}>{title}</Text>
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
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: isGlass ? 130 : 120 }, // room for the floating tab bar / Myra button
  dayBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md },
  dayBtn: { padding: space.sm },
  dayText: { fontSize: 16, fontWeight: '600', color: colors.ink, minWidth: 130, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: isGlass ? 28 : radius.lg + 4, borderWidth: isGlass ? 0 : 1, borderColor: colors.line, padding: space.lg, gap: space.md, boxShadow: shadow },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  heading: { fontSize: 20, fontWeight: isGlass ? '500' : '600', color: colors.ink, flexShrink: 1 },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  label: { fontSize: 11, letterSpacing: isGlass ? 1.6 : 1, textTransform: 'uppercase', color: colors.muted, fontWeight: '700' },
  status: { fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 },
  score: isGlass ? { fontSize: 22, fontWeight: font.light, fontVariant: ['tabular-nums'], color: colors.ink } : { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'], color: colors.insight }, // scores are Happy Orange output
  scoreMax: { fontSize: 12, fontWeight: '600', color: colors.muted },
  meterLabel: { fontSize: 14, color: colors.ink },
  meterRight: { fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  track: { height: isGlass ? 4 : 8, borderRadius: 99, backgroundColor: colors.sunk, overflow: 'hidden' },
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
  // Ganga Dusk: buttons are glass pills with white words, like Oura's "View details" (founder, 19 Nov 2026).
  btnPrimary: isGlass ? { backgroundColor: isLight ? glass.fill : 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: isLight ? glass.line : 'rgba(255,255,255,0.28)' } : { backgroundColor: colors.accent },
  btnInsight: isGlass ? { backgroundColor: isLight ? glass.fill : 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: isLight ? glass.line : 'rgba(255,255,255,0.28)' } : { backgroundColor: colors.insight }, // suggestions and analytics
  btnPlain: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  btnText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  seg: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, overflow: 'hidden', alignSelf: 'flex-start' },
  segBtn: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.surface },
  segOn: { backgroundColor: colors.accent },
  segText: { fontSize: 14, color: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
});
