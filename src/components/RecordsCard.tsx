// Your records on Today (founder, 1 Nov 2026; decision 0045): one line only, the newest personal best (else the
// "close to a record" nudge), so the card stays small between the three circles and Ask Myra.

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { shiftISO, todayISO } from '../lib/dates';
import { locale, tr } from '../lib/i18n';
import { closeToRecord, findRecords, type Rec } from '../lib/records';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { PASTEL } from './Rings';

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
  const r = useMemo(() => findRecords(days, profile, today)[0], [days, profile, today]);
  const close = useMemo(() => (r ? null : closeToRecord(days, profile, today)), [r, days, profile, today]);
  if (!r && !close) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: (r ? r.def.color : PASTEL.lavender) + '2E', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={(r ? r.def.icon : 'trending-up-outline') as never} size={18} color={colors.ink} />
      </View>
      {r ? (
        <>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ flexShrink: 1, fontSize: 15, fontWeight: '600', color: colors.ink }} numberOfLines={1}>{tr(r.title)}</Text>
              {r.isNew ? <Text style={{ flexShrink: 0, fontSize: 9.5, fontWeight: '800', color: '#5E8A4E', backgroundColor: PASTEL.sage + '33', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden' }}>{tr('NEW')}</Text> : null}
            </View>
            <Text style={{ fontSize: 12.5, color: colors.muted }} numberOfLines={1}>
              {when(r, today)}{r.beat != null ? ` · ${tr('beat {n}', { n: r.kind === 'streak' ? String(r.beat) : r.def.fmt(r.beat) })}` : ''}
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{r.kind === 'streak' ? tr('{n} days', { n: r.value }) : r.text}</Text>
        </>
      ) : (
        <Text style={{ flex: 1, color: colors.ink, fontSize: 13.5, lineHeight: 19 }}>
          <Text style={{ fontWeight: '700' }}>{tr('Close to a record:')}</Text> {tr(close!.def.close!, { n: close!.more.toLocaleString('en-IN') })}
        </Text>
      )}
    </View>
  );
}
