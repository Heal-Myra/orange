// Food card: where today's calories come from (carbs, protein, fat) next to the mix Myra aims for (founder, 21 Oct 2026).
// Energy: carbs and protein 4 kcal per gram, fat 9. Aim: protein from the person's protein target, fat 25 % (ICMR-NIN:
// about 20–30 %), carbs the rest. Two small rings, one shared legend with both percentages.

import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { tr } from '../lib/i18n';
import type { MealTotals } from '../lib/scoring';
import { colors } from '../theme';

const PARTS = [
  { key: 'c', name: 'Carbs', color: '#E3B04B' },
  { key: 'p', name: 'Protein', color: colors.body },
  { key: 'f', name: 'Fat', color: colors.soul },
] as const;

type Mix = { c: number; p: number; f: number }; // shares of energy, 0–1

export function mixOf(t: Pick<MealTotals, 'c' | 'p' | 'f'>): Mix | null {
  const c = t.c * 4, p = t.p * 4, f = t.f * 9, all = c + p + f;
  return all > 0 ? { c: c / all, p: p / all, f: f / all } : null;
}

export function aimMix(kcal: number, proteinG: number): Mix {
  const p = Math.min(0.35, (proteinG * 4) / kcal), f = 0.25;
  return { p, f, c: 1 - p - f };
}

function Ring({ mix, label }: { mix: Mix | null; label: string }) {
  const size = 104, stroke = 16, r = (size - stroke) / 2, C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.sunk} strokeWidth={stroke} fill="none" />
        {mix ? PARTS.map(part => {
          const len = mix[part.key] * C;
          const el = (
            <Circle key={part.key} cx={size / 2} cy={size / 2} r={r} stroke={part.color} strokeWidth={stroke} fill="none"
              strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-offset} />
          );
          offset += len;
          return el;
        }) : null}
      </Svg>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>{label}</Text>
    </View>
  );
}

const KCAL_PER_G = { c: 4, p: 4, f: 9, fib: 2 } as const; // fibre: about 2 kcal per gram (FAO; IFCT counts 8 kJ/g)

/** Food card (founder, 22 Oct 2026): total calories, then carbs, protein, fat and fibre: grams against the person's
 *  target, the calories each brings and its share of today's calories next to the aim. */
export function NutritionTable({ totals, kcal, protein, fibre }: { totals: MealTotals; kcal: number; protein: number; fibre: number }) {
  const aim = aimMix(kcal, protein);
  const target = { c: Math.round((aim.c * kcal) / 4), p: protein, f: Math.round((aim.f * kcal) / 9), fib: fibre };
  const fromG = { c: totals.c * 4, p: totals.p * 4, f: totals.f * 9, fib: (totals.fib ?? 0) * KCAL_PER_G.fib };
  const sum = fromG.c + fromG.p + fromG.f + fromG.fib;
  const rows = [
    { key: 'c', name: 'Carbs', color: PARTS[0].color, g: totals.c, aimPct: aim.c },
    { key: 'p', name: 'Protein', color: PARTS[1].color, g: totals.p, aimPct: aim.p },
    { key: 'f', name: 'Fat', color: PARTS[2].color, g: totals.f, aimPct: aim.f },
    { key: 'fib', name: 'Fibre', color: '#8A6BB8', g: totals.fib ?? 0, aimPct: null },
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
        const k = fromG[r.key];
        const share = sum > 0 ? k / sum : null;
        return (
          <View key={r.key} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 10, gap: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: r.color }} />
              <Text style={{ flex: 1, fontSize: 16, color: colors.ink }}>{tr(r.name)}</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, fontVariant: ['tabular-nums'] }}>{Math.round(r.g)}
                <Text style={{ fontWeight: '400', color: colors.muted }}> / {target[r.key]} g</Text></Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, paddingLeft: 18, fontVariant: ['tabular-nums'] }}>
              {Math.round(k)} kcal{share != null ? ` · ${Math.round(share * 100)}% ${tr('of calories')}` : ''}{r.aimPct != null ? ` · ${tr('aim')} ${Math.round(r.aimPct * 100)}%` : ''}
            </Text>
            {bar(r.g, target[r.key], r.color)}
          </View>
        );
      })}
    </View>
  );
}

export function MacroMix({ totals, kcal, protein }: { totals: MealTotals; kcal: number; protein: number }) {
  const now = mixOf(totals), aim = aimMix(kcal, protein);
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 14, gap: 12 }}>
      <Text style={{ fontSize: 16, color: colors.ink }}>{tr('Where your calories come from')}</Text>
      <View style={{ flexDirection: 'row' }}>
        <Ring mix={now} label={tr('Today')} />
        <Ring mix={aim} label={tr('Aim')} />
      </View>
    </View>
  );
}
