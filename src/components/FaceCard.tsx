// Body › Face & beauty (founder, 31 Oct 2026; decision 0035): a selfie read for everyday skin care, shown as a skin score
// ring and one bar per point (founder: "a score displayed as a visual" rather than words), plus the day's kind words.
// Remedies are not listed here: Myra weaves them into her food and movement suggestions (Myra recommends, food plan).
// The photo is read once and not kept; only the results are saved with the day.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { earlierReading, GROUPS, groupScores, needsCare, pointScore, SKIN, skinScore, type SkinKey } from '../lib/face';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { useAttach } from './AttachPlus';
import { selfieReading } from './FeelingCard';
import { Card, Heading, Note, Score } from './ui';
import { MyraLine } from './MyraLine';

/** Numbers stay calm (founder, 31 Oct 2026: no red for concerns; light and minimalist): soft green when good, grey otherwise. */
const tone = (v: number) => (v >= 80 ? colors.good : colors.muted);

/** One ring per group, outermost first, filled by its score; the overall (weighted) skin score in the middle. */
function Rings({ rings, value, size = 150 }: { rings: { id: string; v: number; color: string }[]; value: number; size?: number }) {
  const w = 11, gap = 5;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {rings.map((k, i) => {
          const r = size / 2 - w / 2 - i * (w + gap), c = 2 * Math.PI * r;
          return (
            <G key={k.id}>
              <Circle cx={size / 2} cy={size / 2} r={r} stroke={k.color + '33'} strokeWidth={w} fill="none" />
              <Circle cx={size / 2} cy={size / 2} r={r} stroke={k.color} strokeWidth={w} fill="none" strokeLinecap="round"
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

function Legend({ color, label, value, small }: { color: string; label: string; value: number; small?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ flex: 1, color: colors.ink, fontSize: small ? 13.5 : 15 }} numberOfLines={1}>{label}</Text>
      <Text style={{ color: tone(value), fontWeight: '700', fontSize: small ? 13.5 : 15 }}>{value}%</Text>
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
  // Four groups (founder, 1 Nov 2026, option B): Eyes, Clear skin, Moisture, Sun; the one needing most care below;
  // every point under Show details.
  const groups = groupScores(f);
  const care = needsCare(groups);
  const colorOf = (k: SkinKey) => GROUPS.find(g => g.parts.includes(k))?.color ?? colors.muted;
  const plus = useAttach(async img => {
    const r = await selfieReading(img);
    if (typeof r === 'string') return r;
    update(d => { d.face = r; });
    return null;
  }, { front: true, hint: tr('Take a selfie in daylight, without filters, for a fair skin check.') });

  return (
    // A full card like Food (founder, 31 Oct 2026: "It should be visible like other cards"), not folded away.
    <Card>
      <Heading right={score != null ? <Score value={score} max={100} /> : undefined}>{tr('Face & beauty')}</Heading>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Rings rings={groups.map(g => ({ id: g.id, v: g.v, color: g.color }))} value={score} />
                <View style={{ flex: 1, gap: 9 }}>
                  {groups.map(g => <Legend key={g.id} color={g.color} label={tr(g.label)} value={g.v} />)}
                </View>
              </View>
              {care ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: care.color + '1A' }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: care.color }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15 }}>{tr('Needs most care: {g} · {v}', { g: tr(care.label), v: `${care.v}%` })}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13.5, lineHeight: 19 }}>{tr(care.tip)}</Text>
                  </View>
                </View>
              ) : null}
              <Pressable onPress={() => setMore(m => !m)} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'center' }}>
                <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 13.5 }}>{more ? tr('Hide details') : tr('Show details')} {more ? '˄' : '˅'}</Text>
              </Pressable>
              {more ? (
                <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}>
                  {SKIN.filter(k => f.skin[k.id] && f.skin[k.id] !== 'unclear').map(k => <Legend key={k.id} small color={colorOf(k.id)} label={tr(k.label)} value={pointScore(f.skin[k.id])!} />)}
                  {SKIN.some(k => f.skin[k.id] === 'unclear') ? <Note>{tr("Can't tell from this photo: {list}. A close selfie in daylight helps.", { list: SKIN.filter(k => f.skin[k.id] === 'unclear').map(k => tr(k.label).toLowerCase()).join(', ') })}</Note> : null}
                </View>
              ) : null}
              <Note>{tr('Everyday skin care, not medical advice.')}</Note>
            </>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}><Note>{tr('Tap + for a selfie. Myra reads your skin; the photo is not kept.')}</Note></View>
              {plus.button}
            </View>
          )}
          {plus.status}
        </View>
      <MyraLine card="face" />
    </Card>
  );
}

const shortDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};
