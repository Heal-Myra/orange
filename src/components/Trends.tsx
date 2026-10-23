// Trends view of a tab (founder, 22 Oct 2026): the D · W · M · Q · Y switch, the period with arrows to go back,
// and one card per measure: the period's average, the change against the period before, and a line graph.
// Like Apple Health, everything on the tab covers the period chosen.

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { locale, tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { useRange } from '../lib/range';
import { METRICS, periodOf, RANGES, trendOf, type Metric, type Pillar, type Range } from '../lib/trends';
import { todayISO } from '../lib/dates';
import { colors } from '../theme';
import { Card, Note } from './ui';

const LABEL: Record<Range, string> = { D: 'D', W: 'W', M: 'M', Q: 'Q', Y: 'Y' };
const NAME: Record<Range, string> = { D: 'Day', W: 'Week', M: 'Month', Q: 'Quarter', Y: 'Year' };
const VS: Record<Exclude<Range, 'D'>, string> = { W: 'vs last week', M: 'vs last month', Q: 'vs last quarter', Y: 'vs last year' };
const TODAY_COLOR: Record<string, string> = { bodyScore: colors.body, mindScore: colors.mind, soulScore: colors.soul };
const COLOR: Record<Pillar, string> = { today: colors.insight, body: colors.body, mind: colors.mind, soul: colors.soul };

/** The D · W · M · Q · Y switch, as in Apple Health. */
export function RangeBar() {
  const { range, setRange } = useRange();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.line, borderRadius: 99, padding: 3 }}>
      {RANGES.map(r => {
        const on = r === range;
        return (
          <Pressable key={r} onPress={() => setRange(r)} accessibilityRole="tab" accessibilityState={{ selected: on }}
            accessibilityLabel={tr(NAME[r])}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 99, backgroundColor: on ? colors.surface : 'transparent',
              boxShadow: on ? '0 1px 3px rgba(0,0,0,0.12)' : undefined }}>
            <Text style={{ fontSize: 15, fontWeight: on ? '700' : '500', color: colors.ink }}>{tr(LABEL[r])}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function periodLabel(range: Exclude<Range, 'D'>, start: string, end: string) {
  const d = (iso: string) => { const [y, m, dd] = iso.split('-').map(Number); return new Date(y, m - 1, dd); };
  const L = locale();
  if (range === 'W') {
    const a = d(start), b = d(end);
    const same = a.getMonth() === b.getMonth();
    return `${a.toLocaleDateString(L, same ? { day: 'numeric' } : { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString(L, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  if (range === 'M') return d(start).toLocaleDateString(L, { month: 'long', year: 'numeric' });
  if (range === 'Q') return `${d(start).toLocaleDateString(L, { month: 'short' })} – ${d(end).toLocaleDateString(L, { month: 'short', year: 'numeric' })}`;
  return String(d(start).getFullYear());
}

/** Graph labels in the app's language: weekday initial (Week), day of month (Month, Quarter), month initial (Year). */
function labelOf(range: Exclude<Range, 'D'>, iso: string, before?: string) {
  const [y, m, d] = iso.split('-').map(Number); const date = new Date(y, m - 1, d);
  if (range === 'W') return date.toLocaleDateString(locale(), { weekday: 'narrow' });
  if (range === 'Y') return date.toLocaleDateString(locale(), { month: 'narrow' });
  // Quarter: one point per week; name each month under its first week, so the dates read clearly.
  if (range === 'Q') return !before || before.slice(5, 7) !== iso.slice(5, 7) ? date.toLocaleDateString(locale(), { month: 'short' }) : '';
  return String(d);
}

const fmt = (v: number, m: Metric) =>
  m.decimals ? v.toFixed(m.decimals) : Math.round(v).toLocaleString(locale());

export function Trends({ pillar }: { pillar: Pillar }) {
  const { range, back, setBack } = useRange();
  const { days, profile } = useHeal();
  if (range === 'D') return null;
  const today = todayISO();
  const p = periodOf(range, today, back);
  const metrics = METRICS.filter(m => m.pillar === pillar);
  const goal = profile.me?.goal;
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Pressable accessibilityLabel={tr('Earlier')} onPress={() => setBack(back + 1)} hitSlop={8} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={20} color={colors.muted} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, minWidth: 170, textAlign: 'center' }}>{periodLabel(range, p.start, p.end)}</Text>
        <Pressable accessibilityLabel={tr('Later')} onPress={() => setBack(Math.max(0, back - 1))} disabled={back === 0} hitSlop={8} style={{ padding: 6, opacity: back === 0 ? 0.3 : 1 }}>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
      </View>
      {metrics.map(m => {
        const t = trendOf(m, days, profile, range, today, back, today);
        const better = m.id === 'weight' ? (goal === 'lose' ? 'down' : goal === 'gain' ? 'up' : undefined) : m.better;
        return <TrendCard key={m.id} m={m} t={t} better={better} range={range} labels={p.buckets.map((b, i, all) => labelOf(range, b.start, all[i - 1]?.start))} color={pillar === 'today' ? (TODAY_COLOR[m.id] ?? COLOR.today) : COLOR[pillar]} target={m.target?.(profile)} />;
      })}
      <Note>{tr('Each point is the average of the days you recorded; days with nothing recorded are left out.')}</Note>
    </View>
  );
}

function TrendCard({ m, t, better, range, labels, color, target }: {
  m: Metric; t: ReturnType<typeof trendOf>; better?: 'up' | 'down'; range: Exclude<Range, 'D'>; labels: string[]; color: string; target?: number;
}) {
  const ch = t.change;
  const tiny = ch == null || (t.previous ? Math.abs(ch) / Math.abs(t.previous) < 0.02 : Math.abs(ch) < 0.05);
  const good = ch == null || tiny || !better ? null : (ch > 0) === (better === 'up');
  const changeColor = good == null ? colors.muted : good ? colors.good : colors.bad;
  const pct = ch != null && t.previous ? Math.round((ch / Math.abs(t.previous)) * 100) : null;
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '600' }}>{tr(m.name).toUpperCase()}</Text>
          {t.value == null ? <Text style={{ fontSize: 16, color: colors.muted, marginTop: 4 }}>{tr('No data yet')}</Text> : (
            <Text style={{ marginTop: 2 }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>{m.days ? '' : `${tr('Average')} `}</Text>
              <Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] }}>{fmt(t.value, m)}</Text>
              <Text style={{ fontSize: 14, color: colors.muted }}> {tr(m.unit)}</Text>
            </Text>
          )}
        </View>
        {ch != null ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: changeColor, fontVariant: ['tabular-nums'] }}>
              {tiny ? '→ ' + tr('steady') : `${ch > 0 ? '↑' : '↓'} ${pct != null && !m.days ? `${Math.abs(pct)}%` : fmt(Math.abs(ch), m)}`}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{tr(VS[range])}</Text>
          </View>
        ) : null}
      </View>
      <LineChart values={t.bars} labels={labels} color={color} target={m.days ? undefined : target} decimals={m.decimals} />
      {target && !m.days ? <Note>{tr('Dashed line: your daily target, {n} {unit}', { n: fmt(target, m), unit: tr(m.unit) })}</Note> : null}
    </Card>
  );
}

/** A line graph (founder, 23 Oct 2026: "line graph instead of bar graphs for the trend"). The line joins the days or
 *  weeks that have data and steps over the gaps; dots mark each reading. The scale fits the readings (like Apple Health),
 *  so small changes in direction are visible, with the lowest and highest values shown at the side. */
function LineChart({ values, labels, color, target, decimals }: { values: (number | null)[]; labels: string[]; color: string; target?: number; decimals?: number }) {
  const [w, setW] = useState(0);
  const H = 110, padTop = 8, padBottom = 6, axis = 34; // axis: room on the right for the scale numbers
  const pts = values.map((v, i) => (v == null ? null : { i, v }));
  const have = pts.filter(Boolean) as { i: number; v: number }[];
  const all = [...have.map(p => p.v), ...(target != null ? [target] : [])];
  let lo = all.length ? Math.min(...all) : 0, hi = all.length ? Math.max(...all) : 1;
  if (hi - lo < 1e-6) { lo = Math.max(0, lo - 1); hi = hi + 1; }
  const span = hi - lo; lo = Math.max(0, lo - span * 0.15); hi = hi + span * 0.15;
  const plotW = Math.max(1, w - axis);
  const x = (i: number) => ((i + 0.5) / values.length) * plotW;
  const y = (v: number) => padTop + (1 - (v - lo) / (hi - lo)) * (H - padTop - padBottom);
  const line = have.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = have.length > 1 ? `${line} L${x(have[have.length - 1].i).toFixed(1)},${H} L${x(have[0].i).toFixed(1)},${H} Z` : '';
  const fmtV = (v: number) => (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString(locale()));
  // About six labels under the line, evenly spread, never cut off.
  const step = values.length <= 14 ? 1 : Math.ceil(values.length / 6);
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <Svg width={w} height={H}>
          <Line x1={0} x2={plotW} y1={H - 0.5} y2={H - 0.5} stroke={colors.line} strokeWidth={1} />
          {target != null ? <Line x1={0} x2={plotW} y1={y(target)} y2={y(target)} stroke={colors.muted} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} /> : null}
          {area ? <Path d={area} fill={color} opacity={0.1} /> : null}
          {have.length > 1 ? <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {have.map(p => <Circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={values.length > 20 ? 2.5 : 3.5} fill={colors.surface} stroke={color} strokeWidth={2} />)}
        </Svg>
      ) : <View style={{ height: H }} />}
      {w > 0 && have.length ? (
        <>
          <Text style={{ position: 'absolute', right: 0, top: padTop - 6, fontSize: 10, color: colors.muted }}>{fmtV(hi)}</Text>
          <Text style={{ position: 'absolute', right: 0, top: H - 14, fontSize: 10, color: colors.muted }}>{fmtV(lo)}</Text>
        </>
      ) : null}
      <View style={{ height: 16, marginTop: 4 }}>
        {w > 0 ? labels.map((l, i) => (i % step === 0 ? (
          <Text key={i} style={{ position: 'absolute', left: x(i) - 20, width: 40, textAlign: 'center', fontSize: 10, color: colors.muted }}>{l}</Text>
        ) : null)) : null}
      </View>
    </View>
  );
}
