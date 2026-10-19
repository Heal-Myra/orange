// The Today circle, in the founder's chosen look "A. Calm Teal" (19 Oct 2026):
// a soft tinted disc holding a thin ring of three rounded arcs (Body, Mind, Soul). Each arc fills in
// proportion to its score out of 100; the total out of 300 sits in the middle in Happy Orange coral.
// Below the circle, three coloured tiles open the Body, Mind and Soul tabs.

import { router } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import type { WellBeing } from '../lib/scoring';
import { colors } from '../theme';

const BASE = 210; // designed at 210 px, scaled down on narrow phones
const SPAN = 110; // degrees per arc, leaving small gaps between them

type Part = { key: 'body' | 'mind' | 'soul'; name: string; color: string; start: number; value: number | undefined; route: '/body' | '/mind' | '/soul' };

export function WellBeingRing({ w, label, labelColor }: { w: WellBeing; label: string; labelColor: string }) {
  const { width } = useWindowDimensions();
  const SIZE = Math.min(BASE, width - 96), k = SIZE / BASE;
  const C = SIZE / 2, R = 84 * k, STROKE = 22 * k;

  const pt = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(C + R * Math.cos(a)).toFixed(2)} ${(C + R * Math.sin(a)).toFixed(2)}`;
  };
  const arc = (from: number, to: number) => `M ${pt(from)} A ${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${pt(to)}`;

  const parts = partsOf(w);

  return (
    <View style={{ gap: 14 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: SIZE + 24 * k, height: SIZE + 24 * k, borderRadius: 999, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: SIZE, height: SIZE }}>
            <Svg width={SIZE} height={SIZE}>
              {parts.map(p => {
                const filled = Math.max(0, Math.min(100, p.value ?? 0)) / 100;
                return (
                  <G key={p.key} onPress={() => router.navigate(p.route)}>
                    <Path d={arc(p.start, p.start + SPAN)} stroke={p.color} strokeOpacity={0.2} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
                    {filled > 0 ? <Path d={arc(p.start, p.start + Math.max(1, SPAN * filled))} stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" fill="none" /> : null}
                  </G>
                );
              })}
            </Svg>
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 44 * k, color: colors.insight, fontVariant: ['tabular-nums'], lineHeight: 50 * k }}>{Math.round(w.total)}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>of 300</Text>
            </View>
          </View>
        </View>
        <Text style={{ fontWeight: '600', fontSize: 13, color: labelColor, marginTop: 10 }}>{label}</Text>
      </View>

    </View>
  );
}

// Body top right, Mind bottom, Soul left.
const partsOf = (w: WellBeing): Part[] => [
  { key: 'body', name: 'Body', color: colors.body, start: -55, value: w.body?.total, route: '/body' },
  { key: 'mind', name: 'Mind', color: colors.mind, start: 65, value: w.mind?.total, route: '/mind' },
  { key: 'soul', name: 'Soul', color: colors.soul, start: 185, value: w.soul?.total, route: '/soul' },
];

/** Three coloured tiles under the circle; each opens its tab. */
export function PillarTiles({ w }: { w: WellBeing }) {
  const parts = partsOf(w);
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {parts.map(p => (
        <Pressable key={p.key} accessibilityRole="button"
          accessibilityLabel={`${p.name}: ${p.value == null ? 'not logged' : Math.round(p.value) + ' of 100'}. Open the ${p.name} tab.`}
          onPress={() => router.navigate(p.route)}
          style={({ pressed }) => ({ flex: 1, backgroundColor: p.color, borderRadius: 16, paddingVertical: 12, alignItems: 'center', opacity: pressed ? 0.85 : 1 })}>
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 17 }}>{p.name}</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontVariant: ['tabular-nums'], opacity: 0.95 }}>{p.value == null ? '–' : `${Math.round(p.value)}/100`}</Text>
        </Pressable>
      ))}
    </View>
  );
}
