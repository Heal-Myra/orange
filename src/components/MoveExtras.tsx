// In the Movement card (16 Nov 2026): the walk after dinner (spotted from steps, +2) and, after a run, the cadence coach.

import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { cadenceCoach } from '../lib/cadence';
import { todayISO } from '../lib/dates';
import { WINDOW_MIN, dinnerAt, nudgeNow, walkMinutes } from '../lib/dinnerWalk';
import { stepsBetween } from '../lib/health';
import { clock } from '../lib/runRecords';
import { DINNER_WALK_MIN, DINNER_WALK_PTS } from '../lib/scoring';
import { useRuns } from '../lib/useRuns';
import { useHeal } from '../lib/store';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

const row = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.line };

/** Walk after dinner (founder, 15 Nov 2026 idea 3): no tap; the steps after dinner say it. */
export function DinnerWalk() {
  const { day, date, update } = useHeal();
  const dinner = dinnerAt(day.meals);
  const walked = day.activity.dinnerWalk ?? 0;
  const today = date === todayISO();
  useEffect(() => {
    if (!dinner || walked >= DINNER_WALK_MIN) return;
    const end = new Date(Math.min(Date.now(), dinner.getTime() + WINDOW_MIN * 60000));
    if (end.getTime() - dinner.getTime() < 5 * 60000) return;
    let off = false;
    stepsBetween(dinner, end).then(n => { const m = walkMinutes(n); if (!off && m > walked) update(d => { d.activity.dinnerWalk = m; }); }).catch(() => {});
    return () => { off = true; };
  }, [dinner?.getTime(), walked]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!dinner) return null;
  if (walked >= DINNER_WALK_MIN) return (
    <View style={row}>
      <Text style={{ fontSize: 16 }}>🌙</Text>
      <Text style={{ flex: 1, color: colors.ink, fontSize: 15 }}>{tr('Walk after dinner')}</Text>
      <Text style={{ color: colors.good, fontWeight: '700' }}>✓ {tr('{n} min', { n: walked })} · +{DINNER_WALK_PTS}</Text>
    </View>
  );
  if (today && nudgeNow(dinner, walked)) return <Text style={{ color: colors.insight, fontSize: 15, fontWeight: '600', paddingVertical: 8 }}>✦ {tr('A 10-minute walk now settles dinner.')}</Text>;
  return null;
}

/** Running cadence coach (16 Nov 2026 idea 4): after a run in the last 3 days. */
export function CadenceCoach() {
  const runs = useRuns();
  const c = cadenceCoach(runs, todayISO());
  if (!c) return null;
  const pace = c.secs / c.km;
  const fill = Math.max(0, Math.min(1, (c.cadence - 140) / 50));
  return (
    <View style={{ gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700' }}>🏃 {tr('Run · {km} km', { km: Math.round(c.km * 10) / 10 })} <Text style={{ color: colors.muted, fontWeight: '400', fontSize: 13 }}>· {clock(c.secs)} · {clock(pace)} {tr('per km')}</Text></Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.ink, fontSize: 14.5 }}>{tr('Cadence')}</Text>
        <Text style={{ color: colors.ink, fontSize: 14.5 }}><Text style={{ fontWeight: '700' }}>{c.cadence}</Text> {tr('steps a minute')}</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.sunk }}><View style={{ width: `${fill * 100}%`, height: 8, borderRadius: 4, backgroundColor: colors.accent }} /></View>
      <Text style={{ color: colors.muted, fontSize: 12.5 }}>{tr('Easy, comfortable running for most people: 165–180')}{c.last.length > 1 ? ` · ${tr('last runs')}: ${c.last.join(' · ')}` : ''}</Text>
      <Text style={{ color: colors.insight, fontSize: 15, fontWeight: '600' }}>✦ {tr(...c.line)}</Text>
    </View>
  );
}
