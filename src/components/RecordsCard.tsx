// Your records on Today (founder, 1 Nov 2026; decision 0045): one card, one line, a gold trophy and the newest personal
// best (else the "close to a record" nudge), between the three circles and Ask Myra.

import Svg, { Path } from 'react-native-svg';
import { useMemo } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { shiftISO, todayISO } from '../lib/dates';
import { locale, tr } from '../lib/i18n';
import { closeToRecord, freshRecords, latestRecord, type Rec } from '../lib/records';
import { runRecords } from '../lib/runRecords';
import { nextFor } from '../lib/ladder';
import { useRuns } from '../lib/useRuns';
import { useHeal } from '../lib/store';
import { colors } from '../theme';

const date = (iso: string, o: Intl.DateTimeFormatOptions) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(locale(), o); };

export function when(r: Rec, today: string): string {
  // Fresh records end yesterday: say what they cover.
  if (r.end === shiftISO(today, -1) && r.isNew) {
    if (r.kind === 'week' && r.start === shiftISO(today, -7)) return tr('7 days to yesterday');
    if (r.kind === 'month' && r.start === shiftISO(today, -30)) return tr('30 days to yesterday');
    if (r.kind === 'streak' && r.ongoing) return tr('and counting');
  }
  if (r.kind === 'day') return r.end === today ? tr('Today') : r.end === shiftISO(today, -1) ? tr('Yesterday') : date(r.end, { day: 'numeric', month: 'short' });
  if (r.kind === 'week') return r.start === shiftISO(today, -((new Date().getDay() + 6) % 7) - 7) ? tr('Last week') : tr('Week of {d}', { d: date(r.start, { day: 'numeric', month: 'short' }) });
  if (r.kind === 'month') return date(r.start, { month: 'long', year: 'numeric' });
  return r.ongoing ? tr('Still going') : tr('Ended {d}', { d: date(r.end, { day: 'numeric', month: 'short' }) });
}

export function RecordsCard() {
  const { days, profile } = useHeal();
  const today = todayISO();
  // Only a best that yesterday completed (founder, 4 Nov 2026: never a stale record), plus running bests from Apple Health
  // while new (11 Nov 2026). The newest one always shows (founder, 16 Nov 2026: a record made yesterday must not stay
  // hidden behind an older running best).
  const runs = useRuns();
  const r = useMemo(() => latestRecord(runRecords(runs, today).filter(x => x.isNew), freshRecords(days, profile, today)), [runs, days, profile, today]);
  const close = useMemo(() => (r ? null : closeToRecord(days, profile, today)), [r, days, profile, today]);
  // Founder, 1 Nov 2026: a card named "Top of My Game", a gold trophy (option 2) and one line (option 8).
  return (
    <View style={{ gap: 10, backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>{tr('Top of My Game')}</Text>
        <Pressable onPress={() => router.push('/records')} hitSlop={10} accessibilityRole="button"><Text style={{ color: colors.accent, fontWeight: '600', fontSize: 13 }}>{tr('All')} ›</Text></Pressable>
      </View>
      {r ? (
        <View style={{ gap: 2 }}>
          <RecordRow r={r} today={today} />
          {/* The next rung (founder, 16 Nov 2026: personal-best ladder). */}
          <Text style={{ marginLeft: 38, color: colors.insight, fontSize: 13, fontWeight: '600' }}>{tr('Next: {v}', { v: r.kind === 'streak' ? tr('{n} days', { n: nextFor(r) }) : nextFor(r) })}</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Trophy />
          <Text style={{ flex: 1, color: colors.ink, fontSize: 14, lineHeight: 19 }} numberOfLines={2}>
            {close ? <><Text style={{ fontWeight: '600' }}>{tr('Close to a record:')}</Text> {tr(close.def.close!, { n: close.more.toLocaleString('en-IN') })}</> : <Text style={{ color: colors.muted }}>{tr('No new best yesterday. Today is a fresh chance.')}</Text>}
          </Text>
        </View>
      )}
    </View>
  );
}

/** One record: trophy, "Best week of steps · last week", the number. */
export function RecordRow({ r, today }: { r: Rec; today: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Trophy />
      <Text style={{ flex: 1, fontSize: 15, color: colors.ink }} numberOfLines={1}>
        <Text style={{ fontWeight: '600' }}>{tr(r.title)}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}> · {when(r, today)}</Text>
      </Text>
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{r.kind === 'streak' ? tr('{n} days', { n: r.value }) : r.text.replace(' / 100', '')}</Text>
    </View>
  );
}

/** A soft-gold trophy. */
function Trophy() {
  const g = '#E3B873';
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M8 4h8v5a4 4 0 0 1-8 0V4z" fill={g} />
      <Path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" fill="none" stroke={g} strokeWidth={1.6} />
      <Path d="M11 13h2v4h-2zM8.5 19h7v2h-7z" fill={g} />
    </Svg>
  );
}
