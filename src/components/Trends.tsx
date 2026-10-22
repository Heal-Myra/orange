// Trends view of a tab (founder, 22 Oct 2026): the D · W · M · Q · Y switch, the period with arrows to go back,
// and one card per measure: the period's average, the change against the period before, and a bar chart.
// Like Apple Health, everything on the tab covers the period chosen.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
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

/** Bar labels in the app's language: weekday initial (Week), day of month (Month, Quarter), month initial (Year). */
function labelOf(range: Exclude<Range, 'D'>, iso: string) {
  const [y, m, d] = iso.split('-').map(Number); const date = new Date(y, m - 1, d);
  if (range === 'W') return date.toLocaleDateString(locale(), { weekday: 'narrow' });
  if (range === 'Y') return date.toLocaleDateString(locale(), { month: 'narrow' });
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
        return <TrendCard key={m.id} m={m} t={t} better={better} range={range} labels={p.buckets.map(b => labelOf(range, b.start))} color={pillar === 'today' ? (TODAY_COLOR[m.id] ?? COLOR.today) : COLOR[pillar]} target={m.target?.(profile)} />;
      })}
      <Note>{tr('Each bar is the average of the days you recorded; days with nothing recorded are left out.')}</Note>
    </View>
  );
}

function TrendCard({ m, t, better, range, labels, color, target }: {
  m: Metric; t: ReturnType<typeof trendOf>; better?: 'up' | 'down'; range: Exclude<Range, 'D'>; labels: string[]; color: string; target?: number;
}) {
  const top = Math.max(1, ...t.bars.map(b => b ?? 0), m.days ? 0 : target ?? 0) * 1.1;
  const H = 90;
  const ch = t.change;
  const tiny = ch == null || (t.previous ? Math.abs(ch) / Math.abs(t.previous) < 0.02 : Math.abs(ch) < 0.05);
  const good = ch == null || tiny || !better ? null : (ch > 0) === (better === 'up');
  const changeColor = good == null ? colors.muted : good ? colors.good : colors.bad;
  const pct = ch != null && t.previous ? Math.round((ch / Math.abs(t.previous)) * 100) : null;
  const every = labels.length > 14 ? Math.ceil(labels.length / 7) : 1;
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
      <View style={{ height: H, flexDirection: 'row', alignItems: 'flex-end', gap: labels.length > 20 ? 2 : 4 }}>
        {target && !m.days ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: (target / top) * H, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.muted, opacity: 0.6 }} />
        ) : null}
        {t.bars.map((b, i) => (
          <View key={i} style={{ flex: 1, height: b == null ? 2 : Math.max(3, (b / top) * H), borderRadius: 3,
            backgroundColor: b == null ? colors.line : color, opacity: b == null ? 1 : 0.9 }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: labels.length > 20 ? 2 : 4, marginTop: -4 }}>
        {labels.map((l, i) => (
          <Text key={i} style={{ flex: 1, fontSize: 10, color: colors.muted, textAlign: 'center' }} numberOfLines={1}>{i % every === 0 ? l : ''}</Text>
        ))}
      </View>
      {target && !m.days ? <Note>{tr('Dashed line: your daily target, {n} {unit}', { n: fmt(target, m), unit: tr(m.unit) })}</Note> : null}
    </Card>
  );
}
