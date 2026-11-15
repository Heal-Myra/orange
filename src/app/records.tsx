// Top of My Game: every personal best (founder, 1 Nov 2026; decision 0045), newest first.

import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { RecordRow } from '../components/RecordsCard';
import { NextRungs, RunLadderCard } from '../components/Ladders';
import { Card, Note, Screen } from '../components/ui';
import { todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { findRecords } from '../lib/records';
import { runRecords } from '../lib/runRecords';
import { useRuns } from '../lib/useRuns';
import { useHeal } from '../lib/store';
import { colors } from '../theme';

export default function Records() {
  const { days, profile } = useHeal();
  const today = todayISO();
  const runs = useRuns();
  const recs = useMemo(() => [...runRecords(runs, today), ...findRecords(days, profile, today)].sort((a, b) => (a.isNew === b.isNew ? b.end.localeCompare(a.end) : a.isNew ? -1 : 1)), [runs, days, profile, today]);
  return (
    <Screen noBanner>
      {/* Personal-best ladders (founder, 16 Nov 2026): one step up at a time, beat your own best. */}
      <RunLadderCard runs={runs} k={5} />
      <RunLadderCard runs={runs} k={10} />
      <NextRungs recs={recs} today={today} />
      <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '700', letterSpacing: 0.4, marginTop: 4 }}>{tr('ALL YOUR BESTS')}</Text>
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
