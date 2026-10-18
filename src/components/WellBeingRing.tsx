// The Today ring: one circle made of three parts (Body, Mind, Soul) that together complete it.
// Each part fills in proportion to its score out of 100; tapping a part opens that tab.
// The total out of 300 sits in the middle.

import { router } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { WellBeing } from '../lib/scoring';
import { colors } from '../theme';

// Designed at 320 px wide and scaled down on narrow phones.
const BASE = 320;
const GAP = 18; // degrees of space between the three parts (room for the rounded ends)

type Part = { key: 'body' | 'mind' | 'soul'; name: string; color: string; start: number; value: number | undefined; route: '/body' | '/mind' | '/soul' };

const polar = (c: number, deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
};

const arc = (c: number, from: number, to: number, r: number) => {
  const a = polar(c, from, r), b = polar(c, to, r);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
};

export function WellBeingRing({ w, label, labelColor }: { w: WellBeing; label: string; labelColor: string }) {
  const { width } = useWindowDimensions();
  const SIZE = Math.min(BASE, width - 64), k = SIZE / BASE;
  const C = SIZE / 2, R = 96 * k, W = 24 * k, LABEL_R = R + W / 2 + 28 * k;
  // Body at the top right, Mind at the bottom, Soul at the top left; each part covers 120°.
  const parts: Part[] = [
    { key: 'body', name: 'Body', color: colors.body, start: 0, value: w.body?.total, route: '/body' },
    { key: 'mind', name: 'Mind', color: colors.mind, start: 120, value: w.mind?.total, route: '/mind' },
    { key: 'soul', name: 'Soul', color: colors.soul, start: 240, value: w.soul?.total, route: '/soul' },
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          {parts.map(p => {
            const from = p.start + GAP / 2, to = p.start + 120 - GAP / 2;
            const filled = Math.max(0, Math.min(100, p.value ?? 0)) / 100;
            const end = from + (to - from) * filled;
            const go = () => router.navigate(p.route);
            return [
              <Path key={p.key + 'track'} d={arc(C, from, to, R)} stroke={p.color} strokeOpacity={0.18} strokeWidth={W} fill="none" strokeLinecap="round" onPress={go} />,
              filled > 0.01 ? <Path key={p.key + 'fill'} d={arc(C, from, end, R)} stroke={p.color} strokeWidth={W} fill="none" strokeLinecap="round" onPress={go} /> : null,
            ];
          })}
        </Svg>

        {/* Total in the middle */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 11, letterSpacing: 1, fontWeight: '700', color: colors.muted }}>WELL-BEING</Text>
          <Text style={{ fontSize: 48 * k, color: colors.ink, fontVariant: ['tabular-nums'], lineHeight: 56 * k }}>{Math.round(w.total)}</Text>
          <Text style={{ color: colors.muted }}>of 300</Text>
          <View style={{ width: 120 * k, marginTop: 4 }}><Text style={{ fontWeight: '600', fontSize: 13, color: labelColor, textAlign: 'center' }}>{label}</Text></View>
        </View>

        {/* A tappable label on each part */}
        {parts.map(p => {
          const pos = polar(C, p.start + 60, LABEL_R);
          return (
            <Pressable key={p.key} accessibilityRole="button" accessibilityLabel={`${p.name}: ${p.value == null ? 'not logged' : Math.round(p.value) + ' of 100'}. Open the ${p.name} tab.`}
              onPress={() => router.navigate(p.route)} hitSlop={8}
              style={{ position: 'absolute', left: pos.x - 34, top: pos.y - 22, width: 68, height: 44, alignItems: 'center', justifyContent: 'center',
                backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: p.color }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: p.color }}>{p.name}</Text>
              <Text style={{ fontSize: 13, color: colors.ink, fontVariant: ['tabular-nums'] }}>{p.value == null ? '–' : Math.round(p.value)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontSize: 12, color: colors.muted }}>Tap Body, Mind or Soul to open it</Text>
    </View>
  );
}
