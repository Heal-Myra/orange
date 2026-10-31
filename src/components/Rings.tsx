// One look for every scored card (founder, 31 Oct 2026, decision 0037): concentric rings, one per element, with the card's
// score in the middle, like Face & beauty. Data cards (photo, Apple Health) put a key beside the rings; writing cards put
// the rings on top and the writing boxes below, each box with the dot of its ring (founder chose "text boxes at the bottom").
// Soft pastel colours, never red; the numbers stay calm (ink and grey).

import { Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../theme';

/** The ring colours, shared by every card so the app reads as one family. */
export const PASTEL = {
  peach: '#EBA987', lavender: '#9C95D0', teal: '#6FB7BD', sky: '#86B4DE', sand: '#E3B873', rose: '#D9A7BD', sage: '#9CC08E',
} as const;

export interface RingItem { id: string; color: string; label: string; value: number /* 0..1 */; text?: string }

const c01 = (x: number) => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);
/** Whole numbers, except the journal's natural halves (7.5, 17.5). */
export const fmt = (n: number) => (Number.isInteger(n * 2) ? n : Math.round(n)).toString();

/** Concentric rings, outermost first, each filled by its value; `center` (e.g. the score) in the middle. */
export function RingStack({ items, center, sub, size = 132 }: { items: RingItem[]; center: string; sub?: string; size?: number }) {
  const small = size < 110;
  const w = small ? 6 : items.length > 4 ? 7 : 9, gap = small ? 2 : 3;
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
          <Text style={{ flex: 1, color: colors.ink, fontSize: 13 }} numberOfLines={2}>{k.label}</Text>
          {k.text ? <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 12.5 }}>{k.text}</Text> : null}
        </View>
      ))}
    </View>
  );
}

/** Data cards: rings on the left, key on the right. */
export function RingPanel({ items, score, max }: { items: RingItem[]; score: number | null | undefined; max: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 }}>
      <RingStack items={items} center={score == null ? '–' : fmt(score)} sub={`of ${max}`} />
      <RingKey items={items} />
    </View>
  );
}

/** Writing cards: the rings alone, centred on top; the boxes below carry each ring's dot and points. */
export function RingTop({ items, score, max }: { items: RingItem[]; score: number | null | undefined; max: number }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 4 }}>
      <RingStack items={items} center={score == null ? '–' : fmt(score)} sub={`of ${max}`} size={140} />
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

export const pts = (got: number, of: number) => `${fmt(got)} / ${fmt(of)}`;
