// Body › Face & beauty (founder, 31 Oct 2026; decision 0035): a selfie read for everyday skin care, shown as a skin score
// ring and one bar per point (founder: "a score displayed as a visual" rather than words), plus the day's kind words.
// Remedies are not listed here: Myra weaves them into her food and movement suggestions (Myra recommends, food plan).
// The photo is read once and not kept; only the results are saved with the day.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { earlierReading, pointScore, SKIN, skinScore } from '../lib/face';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { useAttach } from './AttachPlus';
import { selfieReading } from './FeelingCard';
import { Card, Expandable, Note } from './ui';

/** Colour for a score out of 100: green when good, warm when it needs care. */
const tone = (v: number) => (v >= 80 ? colors.body : v >= 50 ? '#D99A3D' : colors.insight);

function Ring({ value, size = 104 }: { value: number; size?: number }) {
  const w = 10, r = (size - w) / 2, c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={w} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={tone(value)} strokeWidth={w} fill="none" strokeLinecap="round"
          strokeDasharray={`${(c * value) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <Text style={{ fontSize: 28, fontWeight: '800', color: colors.ink }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: -2 }}>{tr('skin score')}</Text>
    </View>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.ink, fontSize: 13 }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600' }}>{value}</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' }}>
        <View style={{ width: `${value}%`, height: 8, borderRadius: 4, backgroundColor: tone(value) }} />
      </View>
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
    <Card style={{ paddingVertical: 4 }}>
      <Expandable icon="sparkles-outline" color={colors.insight} title={tr('Face & beauty')}
        status={score != null ? `${tr('Skin {n}/100', { n: score })}${f?.witty ? ` · ${f.witty}` : ''}` : tr('Take a selfie for a skin check')} statusColor={score != null ? colors.insight : undefined}>
        <View style={{ gap: 12, paddingBottom: 12 }}>
          {f && score != null ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Ring value={score} />
                <View style={{ flex: 1, gap: 4 }}>
                  {f.witty ? <Text style={{ color: colors.insight, fontWeight: '800', fontSize: 18 }}>{f.witty}</Text> : null}
                  {was != null ? (
                    <Text style={{ color: score > was ? colors.good : score < was ? colors.bad : colors.muted, fontWeight: '600', fontSize: 13 }}>
                      {score === was ? tr('Same as {day}', { day: shortDay(before!.date) }) : tr('{d} since {day}', { d: `${score > was ? '+' : ''}${score - was}`, day: shortDay(before!.date) })}
                    </Text>
                  ) : null}
                </View>
                {plus.button}
              </View>
              {/* Feel-good first: the best point, then the three biggest concerns; the rest fold away (founder, 31 Oct 2026). */}
              <View style={{ gap: 10 }}>
                {best ? (
                  <View style={{ gap: 6 }}>
                    <Text style={{ color: colors.good, fontWeight: '700', fontSize: 12, letterSpacing: 0.4 }}>{tr('YOUR BEST')}</Text>
                    <Bar label={tr(best.label)} value={best.v} />
                  </View>
                ) : null}
                {concerns.length ? <Text style={{ color: colors.insight, fontWeight: '700', fontSize: 12, letterSpacing: 0.4, marginTop: 4 }}>{tr('TOP CONCERNS')}</Text> : null}
                {concerns.map(k => <Bar key={k.id} label={tr(k.label)} value={k.v} />)}
                {more ? rest.map(k => <Bar key={k.id} label={tr(k.label)} value={k.v} />) : null}
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
      </Expandable>
    </Card>
  );
}

const shortDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};
