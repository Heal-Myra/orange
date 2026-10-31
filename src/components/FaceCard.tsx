// Body › Face & beauty (founder, 31 Oct 2026; decision 0035): a selfie read for everyday skin care, shown as a skin score
// ring and one bar per point (founder: "a score displayed as a visual" rather than words), plus the day's kind words.
// Remedies are not listed here: Myra weaves them into her food and movement suggestions (Myra recommends, food plan).
// The photo is read once and not kept; only the results are saved with the day.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { earlierReading, pointScore, SKIN, skinScore } from '../lib/face';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { useAttach } from './AttachPlus';
import { selfieReading } from './FeelingCard';
import { Card, Heading, Note } from './ui';

/** Numbers stay calm (founder, 31 Oct 2026: no red for concerns; light and minimalist): soft green when good, grey otherwise. */
const tone = (v: number) => (v >= 80 ? colors.good : colors.muted);

/** Each skin point has its own ring colour, like activity rings. */
const RING: Record<string, string> = {
  breakouts: '#EBA987', darkCircles: '#9C95D0', dryness: '#6FB7BD', puffiness: '#86B4DE', tan: '#E3B873', redness: '#D9A7BD', lips: '#9CC08E',
};

/** One ring per point, outermost first, filled by its score; the overall (weighted) skin score in the middle. */
function Rings({ rings, value, size = 150 }: { rings: { id: string; v: number }[]; value: number; size?: number }) {
  const w = 9, gap = 3;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {rings.map((k, i) => {
          const r = size / 2 - w / 2 - i * (w + gap), c = 2 * Math.PI * r;
          return (
            <G key={k.id}>
              <Circle cx={size / 2} cy={size / 2} r={r} stroke={RING[k.id] + '33'} strokeWidth={w} fill="none" />
              <Circle cx={size / 2} cy={size / 2} r={r} stroke={RING[k.id]} strokeWidth={w} fill="none" strokeLinecap="round"
                strokeDasharray={`${Math.max(0.01, (c * k.v) / 100)} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
            </G>
          );
        })}
      </Svg>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.ink }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.muted, marginTop: -2 }}>{tr('skin score')}</Text>
    </View>
  );
}

function Legend({ id, label, value }: { id: string; label: string; value: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: RING[id] }} />
      <Text style={{ flex: 1, color: colors.ink, fontSize: 13 }} numberOfLines={1}>{label}</Text>
      <Text style={{ color: tone(value), fontWeight: '700', fontSize: 13 }}>{value}</Text>
    </View>
  );
}

export function FaceCard() {
  const { day, days, date, update } = useHeal();
  const f = day.face;
  const score = skinScore(f);
  const before = earlierReading(days, date);
  const was = skinScore(before?.face);
  const [more, setMore] = useState(false);
  // Lowest scores first (stable, so ties keep the usual order).
  const points = SKIN.filter(k => f?.skin[k.id]).map(k => ({ ...k, v: pointScore(f!.skin[k.id])! })).sort((a, b) => a.v - b.v);
  const best = points.length ? [...points].sort((a, b) => b.v - a.v)[0] : null;
  const others = points.filter(k => k !== best);
  const concerns = others.filter(k => k.v < 100).slice(0, 3); // only real concerns; all clear means none
  const rest = others.filter(k => !concerns.includes(k));
  const plus = useAttach(async img => {
    const r = await selfieReading(img);
    if (typeof r === 'string') return r;
    update(d => { d.face = r; });
    return null;
  }, { front: true, hint: tr('Take a selfie in daylight, without filters, for a fair skin check.') });

  return (
    // A full card like Food (founder, 31 Oct 2026: "It should be visible like other cards"), not folded away.
    <Card>
      <Heading>{tr('Face & beauty')}</Heading>
        <View style={{ gap: 12 }}>
          {f && score != null ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  {f.witty ? <Text style={{ color: colors.insight, fontWeight: '800', fontSize: 18 }}>{f.witty}</Text> : null}
                  {was != null ? (
                    <Text style={{ color: score > was ? colors.good : colors.muted, fontWeight: '600', fontSize: 13 }}>
                      {score === was ? tr('Same as {day}', { day: shortDay(before!.date) }) : tr('{d} since {day}', { d: `${score > was ? '+' : ''}${score - was}`, day: shortDay(before!.date) })}
                    </Text>
                  ) : null}
                </View>
                {plus.button}
              </View>
              {/* One score in the middle (weighted), a ring for each point shown: the best first, then the three biggest
                  concerns (founder, 31 Oct 2026); the rest fold away. */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Rings rings={[...(best ? [best] : []), ...concerns, ...(more ? rest : [])]} value={score} size={more ? 170 : 150} />
                <View style={{ flex: 1, gap: 7 }}>
                  {best ? <Text style={{ color: colors.good, fontWeight: '700', fontSize: 11, letterSpacing: 0.4 }}>{tr('YOUR BEST')}</Text> : null}
                  {best ? <Legend id={best.id} label={tr(best.label)} value={best.v} /> : null}
                  {concerns.length ? <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 11, letterSpacing: 0.4, marginTop: 4 }}>{tr('TOP CONCERNS')}</Text> : null}
                  {concerns.map(k => <Legend key={k.id} id={k.id} label={tr(k.label)} value={k.v} />)}
                  {more && rest.length ? <View style={{ height: 4 }} /> : null}
                  {more ? rest.map(k => <Legend key={k.id} id={k.id} label={tr(k.label)} value={k.v} />) : null}
                </View>
              </View>
              {rest.length ? (
                <Pressable onPress={() => setMore(m => !m)} hitSlop={8} accessibilityRole="button">
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>{more ? tr('Show less') : tr('See all {n}', { n: points.length })}</Text>
                </Pressable>
              ) : null}
              <Note>{tr('Myra adds remedies to your food and movement suggestions. Everyday skin care, not medical advice.')}</Note>
            </>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}><Note>{tr('Tap + for a selfie. Myra reads your skin; the photo is not kept.')}</Note></View>
              {plus.button}
            </View>
          )}
          {plus.status}
        </View>
    </Card>
  );
}

const shortDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};
