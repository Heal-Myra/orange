// Your records on Today (founder, 1 Nov 2026; decision 0045): newest personal bests first, then the ones still
// standing, and a gentle "close to a record" line. The card fills the space left above Ask Myra, showing as many rows
// as fit, so Today ends exactly at the bottom of the screen.

import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { shiftISO, todayISO } from '../lib/dates';
import { locale, tr } from '../lib/i18n';
import { closeToRecord, findRecords, type Rec } from '../lib/records';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { PASTEL } from './Rings';

const ROW = 58, HEAD = 44, CLOSE = 62, PAD = 28;
const date = (iso: string, o: Intl.DateTimeFormatOptions) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(locale(), o); };

function when(r: Rec, today: string): string {
  if (r.kind === 'day') return r.end === today ? tr('Today') : r.end === shiftISO(today, -1) ? tr('Yesterday') : date(r.end, { day: 'numeric', month: 'short' });
  if (r.kind === 'week') return r.start === shiftISO(today, -((new Date().getDay() + 6) % 7) - 7) ? tr('Last week') : tr('Week of {d}', { d: date(r.start, { day: 'numeric', month: 'short' }) });
  if (r.kind === 'month') return date(r.start, { month: 'long', year: 'numeric' });
  return r.ongoing ? tr('Still going') : tr('Ended {d}', { d: date(r.end, { day: 'numeric', month: 'short' }) });
}

export function RecordsCard() {
  const { days, profile } = useHeal();
  const today = todayISO();
  const recs = useMemo(() => findRecords(days, profile, today), [days, profile, today]);
  const close = useMemo(() => closeToRecord(days, profile, today), [days, profile, today]);
  const [h, setH] = useState(0);
  const fit = Math.max(1, Math.floor((h - HEAD - PAD - (close ? CLOSE : 0)) / ROW));
  const show = recs.slice(0, fit);

  return (
    // The outer box takes the free height; the card inside fills it.
    <View style={{ flex: 1, minHeight: HEAD + PAD + ROW }} onLayout={e => setH(e.nativeEvent.layout.height)}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 4 }}>{tr('Your records')}</Text>
        {show.length ? show.map((r, i) => (
          <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: ROW, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: r.def.color + '2E', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={r.def.icon as never} size={18} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ flexShrink: 1, fontSize: 15, fontWeight: '600', color: colors.ink }} numberOfLines={1}>{tr(r.title)}</Text>
                {r.isNew ? <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#5E8A4E', backgroundColor: PASTEL.sage + '33', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden' }}>{tr('NEW')}</Text> : null}
              </View>
              <Text style={{ fontSize: 12.5, color: colors.muted }} numberOfLines={1}>
                {when(r, today)}{r.beat != null ? ` · ${tr('beat {n}', { n: r.kind === 'streak' ? String(r.beat) : r.def.fmt(r.beat) })}` : ''}
              </Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{r.kind === 'streak' ? tr('{n} days', { n: r.value }) : r.text}</Text>
          </View>
        )) : (
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 }}>{tr('Your best days, weeks and months will appear here as you keep logging.')}</Text>
        )}
        <View style={{ flex: 1 }} />
        {close ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: PASTEL.lavender + '1A' }}>
            <Ionicons name="trending-up-outline" size={18} color="#6A62A8" />
            <Text style={{ flex: 1, color: colors.ink, fontSize: 13.5, lineHeight: 19 }}>
              <Text style={{ fontWeight: '700' }}>{tr('Close to a record:')}</Text> {tr(close.def.close!, { n: close.more.toLocaleString('en-IN') })}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
