// Food card: where today's calories come from (carbs, protein, fat) next to the mix Myra aims for (founder, 21 Oct 2026).
// Energy: carbs and protein 4 kcal per gram, fat 9. Aim: protein from the person's protein target, fat 25 % (ICMR-NIN:
// about 20–30 %), carbs the rest. Two rings with the share written on each slice, and one legend.

import type { ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { tr } from '../lib/i18n';
import type { MealTotals } from '../lib/scoring';
import { colors } from '../theme';

const PARTS = [
  { key: 'c', name: 'Carbs', color: '#E3B04B' },
  { key: 'p', name: 'Protein', color: colors.body },
  { key: 'f', name: 'Fat', color: colors.soul },
  { key: 'fib', name: 'Fibre', color: '#8A6BB8' },
] as const;

type Mix = { c: number; p: number; f: number; fib: number }; // shares of energy, 0–1

// Energy per gram: carbs and protein 4 kcal, fat 9, fibre about 2 (FAO; IFCT counts 8 kJ/g).
export function mixOf(t: Pick<MealTotals, 'c' | 'p' | 'f' | 'fib'>): Mix | null {
  const c = t.c * 4, p = t.p * 4, f = t.f * 9, fib = (t.fib ?? 0) * 2, all = c + p + f + fib;
  return all > 0 ? { c: c / all, p: p / all, f: f / all, fib: fib / all } : null;
}

export function aimMix(kcal: number, proteinG: number, fibreG = 25): Mix {
  const p = Math.min(0.35, (proteinG * 4) / kcal), f = 0.25, fib = Math.min(0.06, (fibreG * 2) / kcal);
  return { p, f, fib, c: 1 - p - f - fib };
}

const FONT = Platform.OS === 'web' ? 'Inter, -apple-system, Helvetica, Arial, sans-serif' : undefined;

/** A ring of carbs, protein, fat and fibre, with each share written on its slice (founder, 22 Oct 2026). */
function Ring({ mix, label }: { mix: Mix | null; label: string }) {
  const size = 156, pad = 12, stroke = 26, cx = size / 2, r = (size - stroke) / 2 - pad, C = 2 * Math.PI * r;
  let offset = 0, angle = -90;
  return (
    <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cx} r={r} stroke={colors.sunk} strokeWidth={stroke} fill="none" />
        {mix ? PARTS.map(part => {
          const share = mix[part.key], len = share * C;
          const mid = ((angle + share * 180) * Math.PI) / 180; // middle of this slice
          const el = (
            <G key={part.key}>
              <Circle cx={cx} cy={cx} r={r} stroke={part.color} strokeWidth={stroke} fill="none" transform={`rotate(-90 ${cx} ${cx})`}
                strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-offset} />
              {share > 0.004 ? (() => {
                // Big slices: the share inside the slice; thin slices (e.g. fibre): just outside the ring.
                const inside = share >= 0.045, rr = inside ? r : r + stroke / 2 + 9;
                return (
                  <SvgText x={cx + rr * Math.cos(mid)} y={cx + rr * Math.sin(mid) + 4} fill={inside ? '#FFFFFF' : colors.ink}
                    fontSize={11} fontWeight="700" textAnchor="middle" fontFamily={FONT}>
                    {`${Math.round(share * 100)}%`}
                  </SvgText>
                );
              })() : null}
            </G>
          );
          offset += len; angle += share * 360;
          return el;
        }) : null}
      </Svg>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>{label}</Text>
    </View>
  );
}

/** Food card (founder, 22 Oct 2026): total calories, then carbs, protein, fat and fibre in grams against the person's
 *  targets. The share of calories is shown once, on the two rings below (no repeating it here). */
export function NutritionTable({ totals, kcal, protein, fibre }: { totals: MealTotals; kcal: number; protein: number; fibre: number }) {
  const aim = aimMix(kcal, protein, fibre);
  const target = { c: Math.round((aim.c * kcal) / 4), p: protein, f: Math.round((aim.f * kcal) / 9), fib: fibre };
  const rows = [
    { key: 'c', name: 'Carbs', color: PARTS[0].color, g: totals.c, aimPct: aim.c },
    { key: 'p', name: 'Protein', color: PARTS[1].color, g: totals.p, aimPct: aim.p },
    { key: 'f', name: 'Fat', color: PARTS[2].color, g: totals.f, aimPct: aim.f },
    { key: 'fib', name: 'Fibre', color: PARTS[3].color, g: totals.fib ?? 0, aimPct: aim.fib },
  ] as const;
  const bar = (v: number, max: number, color: string) => (
    <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.sunk, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, max ? v / max : 0)) * 100}%`, height: 4, backgroundColor: color }} />
    </View>
  );
  return (
    <View>
      <View style={{ paddingVertical: 12, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink }}>{tr('Total calories')}</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] }}>{Math.round(totals.kcal).toLocaleString()}
            <Text style={{ fontWeight: '400', color: colors.muted }}> / {kcal.toLocaleString()} kcal</Text></Text>
        </View>
        {bar(totals.kcal, kcal, colors.body)}
      </View>
      {rows.map(r => {
        return (
          <View key={r.key} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 10, gap: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: r.color }} />
              <Text style={{ flex: 1, fontSize: 16, color: colors.ink }}>{tr(r.name)}</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, fontVariant: ['tabular-nums'] }}>{Math.round(r.g)}
                <Text style={{ fontWeight: '400', color: colors.muted }}> / {target[r.key]} g</Text></Text>
            </View>
            {bar(r.g, target[r.key], r.color)}
          </View>
        );
      })}
    </View>
  );
}

export function MacroMix({ totals, kcal, protein, fibre, right }: { totals: MealTotals; kcal: number; protein: number; fibre?: number; right?: ReactNode }) {
  const now = mixOf(totals), aim = aimMix(kcal, protein, fibre);
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 14, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontSize: 16, color: colors.ink, flex: 1 }}>{tr('Where your calories come from')}</Text>
        {right}
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Ring mix={now} label={tr('Today')} />
        <Ring mix={aim} label={tr('Aim')} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
        {PARTS.map(p => (
          <View key={p.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.color }} />
            <Text style={{ fontSize: 14, color: colors.ink }}>{tr(p.name)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
