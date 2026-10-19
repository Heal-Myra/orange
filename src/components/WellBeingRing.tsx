// The Today circle: three flowing sections (Body, Mind, Soul) that meet without gaps and together complete one circle.
// The borders between them are gentle S-curves, like water. Each section fills from the inside outwards, like liquid,
// in proportion to its score out of 100. Tapping a section (or its label) opens that tab. The total out of 300 is in the middle.

import { router } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { ClipPath, Circle, Defs, G, Path } from 'react-native-svg';
import type { WellBeing } from '../lib/scoring';
import { colors } from '../theme';

const BASE = 320;   // designed at 320 px wide, scaled down on narrow phones
const WAVE = 9;     // how far (in degrees) the S-shaped borders swing
const STEPS = 48;   // points per curve; enough to look smooth

type Key = 'body' | 'mind' | 'soul';
type Part = { key: Key; name: string; color: string; start: number; value: number | undefined; route: '/body' | '/mind' | '/soul' };

export function WellBeingRing({ w, label, labelColor }: { w: WellBeing; label: string; labelColor: string }) {
  const { width } = useWindowDimensions();
  const SIZE = Math.min(BASE, width - 64), k = SIZE / BASE;
  const C = SIZE / 2, R_OUT = 150 * k, R_IN = 84 * k;

  const pt = (deg: number, r: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;
  };
  // The border at angle `at`, walked from the outer edge (t = 1) to the inner edge (t = 0) or back.
  const seam = (at: number, outward: boolean) => Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = outward ? i / STEPS : 1 - i / STEPS;
    return `L ${pt(at + WAVE * Math.sin(2 * Math.PI * t), R_IN + (R_OUT - R_IN) * t)}`;
  }).join(' ');
  const arcPts = (from: number, to: number, r: number) => Array.from({ length: STEPS + 1 }, (_, i) => `L ${pt(from + ((to - from) * i) / STEPS, r)}`).join(' ');

  const section = (from: number, to: number) =>
    `M ${pt(from, R_OUT)} ${arcPts(from, to, R_OUT)} ${seam(to, false)} ${arcPts(to, from, R_IN)} ${seam(from, true)} Z`;

  // Body top right, Mind bottom, Soul top left. Each covers 120°; neighbours share the same wavy border.
  const parts: Part[] = [
    { key: 'body', name: 'Body', color: colors.body, start: -60, value: w.body?.total, route: '/body' },
    { key: 'mind', name: 'Mind', color: colors.mind, start: 60, value: w.mind?.total, route: '/mind' },
    { key: 'soul', name: 'Soul', color: colors.soul, start: 180, value: w.soul?.total, route: '/soul' },
  ];

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            {parts.map(p => {
              const filled = Math.max(0, Math.min(100, p.value ?? 0)) / 100;
              return (
                <ClipPath key={p.key} id={`fill-${p.key}`}>
                  <Circle cx={C} cy={C} r={R_IN + (R_OUT - R_IN) * filled} />
                </ClipPath>
              );
            })}
          </Defs>
          {parts.map(p => {
            const d = section(p.start, p.start + 120);
            const go = () => router.navigate(p.route);
            return (
              <G key={p.key} onPress={go}>
                <Path d={d} fill={p.color} fillOpacity={0.2} />
                {(p.value ?? 0) > 0 ? <Path d={d} fill={p.color} fillOpacity={0.9} clipPath={`url(#fill-${p.key})`} /> : null}
                <Path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={1.5} />
              </G>
            );
          })}
        </Svg>

        {/* Total in the middle */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 10, letterSpacing: 1, fontWeight: '700', color: colors.muted }}>WELL-BEING</Text>
          <Text style={{ fontSize: 40 * k, color: colors.insight, fontVariant: ['tabular-nums'], lineHeight: 46 * k }}>{Math.round(w.total)}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>of 300</Text>
          <View style={{ width: 120 * k, marginTop: 2 }}>
            <Text style={{ fontWeight: '600', fontSize: 12, color: labelColor, textAlign: 'center' }}>{label}</Text>
          </View>
        </View>

        {/* A tappable label in the middle of each section */}
        {parts.map(p => {
          const a = ((p.start + 60 - 90) * Math.PI) / 180, r = (R_IN + R_OUT) / 2;
          const x = C + r * Math.cos(a), y = C + r * Math.sin(a);
          return (
            <Pressable key={p.key} accessibilityRole="button"
              accessibilityLabel={`${p.name}: ${p.value == null ? 'not logged' : Math.round(p.value) + ' of 100'}. Open the ${p.name} tab.`}
              onPress={() => router.navigate(p.route)} hitSlop={10}
              style={{ position: 'absolute', left: x - 32, top: y - 21, width: 64, height: 42, alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 14 }}>
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
