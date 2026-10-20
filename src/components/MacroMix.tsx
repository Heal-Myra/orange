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

export function MacroMix({ totals, kcal, protein }: { totals: MealTotals; kcal: number; protein: number }) {
  const now = mixOf(totals), aim = aimMix(kcal, protein);
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 14, gap: 12 }}>
      <Text style={{ fontSize: 16, color: colors.ink }}>{tr('Where your calories come from')}</Text>
      <View style={{ flexDirection: 'row' }}>
        <Ring mix={now} label={tr('Today')} />
        <Ring mix={aim} label={tr('Aim')} />
      </View>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ flex: 1 }} />
          <Text style={{ width: 64, textAlign: 'right', fontSize: 13, color: colors.muted }}>{tr('Today')}</Text>
          <Text style={{ width: 64, textAlign: 'right', fontSize: 13, color: colors.muted }}>{tr('Aim')}</Text>
        </View>
        {PARTS.map(part => (
          <View key={part.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: part.color }} />
            <Text style={{ flex: 1, fontSize: 15, color: colors.ink }}>{tr(part.name)}</Text>
            <Text style={{ width: 64, textAlign: 'right', fontSize: 15, fontWeight: '600', color: colors.ink, fontVariant: ['tabular-nums'] }}>{now ? pct(now[part.key]) : '–'}</Text>
            <Text style={{ width: 64, textAlign: 'right', fontSize: 15, color: colors.muted, fontVariant: ['tabular-nums'] }}>{pct(aim[part.key])}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
