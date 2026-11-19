// Personal-best ladders (founder, 16 Nov 2026 idea 1) at the top of Top of My Game: for each running best the rungs
// reached and the next one, with the coach's one step; for other bests, the next rung.

import { Text, View } from 'react-native';
import { RecordRow } from './RecordsCard';
import { clock } from '../lib/runRecords';
import { ladderPicks, nextFor, paceText, runLadder } from '../lib/ladder';
import type { Run } from '../lib/health';
import type { Rec } from '../lib/records';
import { formatDay } from '../lib/dates';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

const dot = (kind: 'on' | 'next' | 'later') => (
  <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: kind === 'next' ? colors.insight : colors.accent,
    backgroundColor: kind === 'on' ? colors.accent : kind === 'next' ? colors.tint : 'transparent' }} />
);

export function RunLadderCard({ runs, k }: { runs: Run[]; k: number }) {
  const l = runLadder(runs, k);
  if (!l) return null;
  const rung = (kind: 'on' | 'next' | 'later', value: number, right: string, key: string) => (
    <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
      {dot(kind)}
      <Text style={{ flex: 1, fontSize: 15, color: colors.ink, fontWeight: kind === 'next' ? '700' : '400' }}>{clock(value)}{kind === 'on' ? ' ✓' : ''}</Text>
      <Text style={{ fontSize: 13, color: kind === 'next' ? colors.insight : colors.muted, fontWeight: kind === 'next' ? '700' : '400' }}>{right}</Text>
    </View>
  );
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 22, padding: 16, gap: 2 }}>
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>🏃 {tr('Fastest {k} km', { k })}</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 4 }}>{tr('Your best: {t} on {d}', { t: clock(l.best), d: formatDay(l.bestAt) })}</Text>
      {[...l.later].reverse().map((v, i) => rung('later', v, tr('later'), 'l' + i))}
      {rung('next', l.next, tr('next step'), 'n')}
      {l.reached.map((r, i) => rung('on', r.value, formatDay(r.at!), 'r' + i))}
      <Text style={{ color: colors.insight, fontSize: 15, fontWeight: '600', marginTop: 6 }}>✦ {tr('Two easy runs, then try {k} km at {p} pace.', { k, p: paceText(l.pace) })}</Text>
    </View>
  );
}

export function NextRungs({ recs, today }: { recs: Rec[]; today: string }) {
  const picks = ladderPicks(recs);
  if (!picks.length) return null;
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 8 }}>
      <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '700', letterSpacing: 0.4, paddingVertical: 6 }}>{tr('NEXT RUNG')}</Text>
      {picks.map((r, i) => (
        <View key={r.key} style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line, gap: 2 }}>
          <RecordRow r={r} today={today} />
          <Text style={{ marginLeft: 38, color: colors.insight, fontSize: 13, fontWeight: '600' }}>{tr('Next: {v}', { v: r.kind === 'streak' ? tr('{n} days', { n: nextFor(r) }) : nextFor(r, tr('lakh')) })}</Text>
        </View>
      ))}
    </View>
  );
}
