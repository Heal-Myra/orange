// Top of My Game: every personal best (founder, 1 Nov 2026; decision 0045), newest first.

import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { RecordRow } from '../components/RecordsCard';
import { Card, Note, Screen } from '../components/ui';
import { todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { findRecords } from '../lib/records';
import { useHeal } from '../lib/store';
import { colors } from '../theme';

export default function Records() {
  const { days, profile } = useHeal();
  const today = todayISO();
  const recs = useMemo(() => findRecords(days, profile, today), [days, profile, today]);
  return (
    <Screen noBanner>
      <Card style={{ gap: 0 }}>
        {recs.length ? recs.map((r, i) => (
          <View key={r.key} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line, gap: 2 }}>
            <RecordRow r={r} today={today} />
            {r.beat != null ? <Text style={{ marginLeft: 38, color: colors.muted, fontSize: 12.5 }}>{tr('beat {n}', { n: r.kind === 'streak' ? String(r.beat) : r.def.fmt(r.beat) })}</Text> : null}
          </View>
        )) : <Note>{tr('Your best days, weeks and months will appear here as you keep logging.')}</Note>}
      </Card>
    </Screen>
  );
}
