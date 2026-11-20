// One look for every scored card (founder, 31 Oct 2026, decision 0037): concentric rings, one per element, with the card's
// score in the middle, like Face & beauty. Data cards (photo, Apple Health) put a key beside the rings; writing cards put
// the rings on top and the writing boxes below, each box with the dot of its ring (founder chose "text boxes at the bottom").
// Soft pastel colours, never red; the numbers stay calm (ink and grey).

import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { tr } from '../lib/i18n';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, font, glass, isGlass, statusColor } from '../theme';

/** The ring colours, shared by every card so the app reads as one family. */
export const PASTEL = {
  peach: '#EBA987', lavender: '#9C95D0', teal: '#6FB7BD', sky: '#86B4DE', sand: '#E3B873', rose: '#D9A7BD', sage: '#9CC08E',
} as const;

export interface RingItem { id: string; color: string; label: string; value: number /* 0..1 */; text?: string; sub?: string; keyText?: string /* replaces the % in the key, e.g. '–' for nothing yet */ }
/** Inside cards every part shows as a percentage (founder, 4 Nov 2026); only the card's own score stays in points. */
export const pct = (v: number) => `${Math.round((Number.isFinite(v) ? Math.max(0, v) : 0) * 100)}%`;

const c01 = (x: number) => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);
/** Whole numbers, except the journal's natural halves (7.5, 17.5). */
export const fmt = (n: number) => (Number.isInteger(n * 2) ? n : Math.round(n)).toString();

/** Concentric rings, outermost first, each filled by its value; `center` (e.g. the score) in the middle. */
export function RingStack({ items, center, sub, size = 132 }: { items: RingItem[]; center: string; sub?: string; size?: number }) {
  const small = size < 110;
  const many = items.length > 4; // e.g. Food's five rings: thinner, so the score in the middle stays clear
  const w = small || many ? 6 : 9, gap = small || many ? 2 : 3;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {items.map((k, i) => {
          const r = size / 2 - w / 2 - i * (w + gap), c = 2 * Math.PI * r, v = c01(k.value);
          return (
            <G key={k.id}>
              <Circle cx={size / 2} cy={size / 2} r={r} stroke={k.color + '33'} strokeWidth={w} fill="none" />
              {v > 0 ? <Circle cx={size / 2} cy={size / 2} r={r} stroke={k.color} strokeWidth={w} fill="none" strokeLinecap="round"
                strokeDasharray={`${c * v} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} /> : null}
            </G>
          );
        })}
      </Svg>
      <Text style={{ fontSize: small ? 18 : size > 120 ? 24 : 20, fontWeight: '800', color: colors.ink }}>{center}</Text>
      {sub ? <Text style={{ fontSize: 10, color: colors.muted, marginTop: -2 }}>{sub}</Text> : null}
    </View>
  );
}

export const Dot = ({ color, size = 10 }: { color: string; size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
);

/** The key beside the rings: dot, name, value. */
export function RingKey({ items }: { items: RingItem[] }) {
  return (
    <View style={{ flex: 1, gap: 7 }}>
      {items.map(k => (
        <View key={k.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Dot color={k.color} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontSize: 13 }} numberOfLines={2}>{k.label}</Text>
            {k.sub ? <Text style={{ color: colors.muted, fontSize: 11.5 }} numberOfLines={1}>{k.sub}</Text> : null}
          </View>
          <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 12.5 }}>{k.keyText ?? pct(k.value)}</Text>
        </View>
      ))}
    </View>
  );
}

/** Tapping the rings opens the card's details and trends (founder, 31 Oct 2026); a small "Trends ›" under them says so. */
export function RingTap({ trend, children }: { trend?: string; children: ReactNode }) {
  if (!trend) return <>{children}</>;
  return (
    <Pressable onPress={() => router.push({ pathname: '/trend', params: { card: trend } })} accessibilityRole="button"
      accessibilityLabel={tr('Details and trends')} hitSlop={6} style={({ pressed }) => ({ alignItems: 'center', gap: 2, opacity: pressed ? 0.7 : 1 })}>
      {children}
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.accent }}>{tr('Trends')} ›</Text>
    </Pressable>
  );
}

/** Data cards: rings on the left, key on the right. */
/** "What made this score" (decision 0063, Oura's Contributors): each part as a label, its value on the right and a thin
 *  bar under it. White when going well; soft coral only where it needs care (under half, once something is logged). */
export function Contributors({ items }: { items: RingItem[] }) {
  return (
    <View style={{ gap: 16 }}>
      {items.map(k => {
        const v = c01(k.value);
        const care = v > 0 && v < 0.5;
        return (
          <View key={k.id} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
              <Text style={{ flex: 1, color: colors.ink, fontSize: 17 }} numberOfLines={1}>{k.label}</Text>
              <Text style={{ color: care ? statusColor('Needs care') : colors.ink, fontSize: 16, fontVariant: ['tabular-nums'] }} numberOfLines={1}>{k.text ?? k.keyText ?? pct(k.value)}</Text>
            </View>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: glass.track, overflow: 'hidden' }}>
              <View style={{ width: `${v * 100}%`, height: '100%', borderRadius: 2, backgroundColor: care ? statusColor('Needs care') : glass.trackFill }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** The card's score as one big thin number (glass look), tapping opens its detail page. */
function ScoreBig({ score, max, trend }: { score: number | null | undefined; max: number; trend?: string }) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
      <Text style={{ fontSize: 56, fontWeight: font.thin, color: colors.ink, lineHeight: 62, fontVariant: ['tabular-nums'] }}>{score == null ? '–' : fmt(score)}</Text>
      <Text style={{ fontSize: 16, color: colors.muted }}>{tr('of {n}', { n: max })}</Text>
      <View style={{ flex: 1 }} />
      {trend ? <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>{tr('Details')} ›</Text> : null}
    </View>
  );
  return trend ? <Pressable onPress={() => router.push({ pathname: '/trend', params: { card: trend } })} accessibilityRole="button" accessibilityLabel={tr('Details and trends')}>{body}</Pressable> : body;
}

export function RingPanel({ items, score, max, trend, sub }: { items: RingItem[]; score: number | null | undefined; max: number; trend?: string; sub?: string }) {
  // Oura-like redesign (decision 0063): a big thin score, then what made it, as bars; the rings stay for Calm Teal.
  if (isGlass) return <View style={{ gap: 18, paddingVertical: 4 }}><ScoreBig score={score} max={max} trend={trend} /><Contributors items={items} /></View>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 }}>
      <RingTap trend={trend}><RingStack items={items} center={score == null ? '–' : fmt(score)} sub={sub ?? `of ${max}`} /></RingTap>
      <RingKey items={items} />
    </View>
  );
}

/** Writing cards: the rings alone, centred on top; the boxes below carry each ring's dot and points. */
export function RingTop({ items, score, max, trend }: { items: RingItem[]; score: number | null | undefined; max: number; trend?: string }) {
  if (isGlass) return <View style={{ paddingVertical: 4 }}><ScoreBig score={score} max={max} trend={trend} /></View>;
  return (
    <View style={{ alignItems: 'center', paddingVertical: 4 }}>
      <RingTap trend={trend}><RingStack items={items} center={score == null ? '–' : fmt(score)} sub={`of ${max}`} size={140} /></RingTap>
    </View>
  );
}

/** A writing box's heading: its ring's dot, the prompt and its points. */
export function EntryHead({ color, title, points }: { color: string; title: string; points: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <Dot color={color} />
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink }}>{title}</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted }}>{points}</Text>
    </View>
  );
}

export const pts = (got: number, of: number) => pct(of ? got / of : 0); // a percentage since 4 Nov 2026
