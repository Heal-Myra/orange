// Cool room for deep sleep (founder, 16 Nov 2026 idea 10), inside Sleep › Details: deep sleep on cooler and warmer
// nights, one tip for tonight, and a one-tap "how was the room?" after waking.

import { Pressable, Text, View } from 'react-native';
import { NEED, coolRoom } from '../lib/coolRoom';
import { todayISO } from '../lib/dates';
import { useHeal } from '../lib/store';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

const ROOM = [['warm', '🥵', 'Warm'], ['ok', '🙂', 'Just right'], ['cold', '🥶', 'Cold']] as const;

export function CoolRoom() {
  const { days, day, date, update } = useHeal();
  const r = coolRoom(days, date);
  const row = (label: string, value: string, good?: boolean) => (
    <View style={{ flexDirection: 'row', paddingVertical: 7, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Text style={{ flex: 1, color: colors.ink, fontSize: 14.5 }}>{label}</Text>
      <Text style={{ color: good ? colors.good : colors.ink, fontSize: 14.5, fontWeight: '700' }}>{value}</Text>
    </View>
  );
  const asked = date === todayISO() && day.sleep.hours != null;
  return (
    <View style={{ gap: 4, marginTop: 8 }}>
      <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15 }}>{tr('Your deepest nights')}</Text>
      {r ? (
        <>
          {row(r.by === 'temp' ? tr('Cooler nights') : tr('Room cool or just right'), tr('{n} h deep', { n: r.cool }), r.cool > r.warm)}
          {row(r.by === 'temp' ? tr('Warmer nights') : tr('Room warm'), tr('{n} h deep', { n: r.warm }), r.warm > r.cool)}
          {r.lastTemp != null && r.usual != null ? row(tr('Last night against your usual'), `${r.lastTemp - r.usual >= 0 ? '+' : ''}${Math.round((r.lastTemp - r.usual) * 10) / 10} °C`) : null}
          <Text style={{ color: colors.insight, fontSize: 15, fontWeight: '600', marginTop: 4 }}>✦ {tr(...r.line)}</Text>
          <Text style={{ color: colors.muted, fontSize: 12.5 }}>{r.by === 'temp' ? tr('From your ring or Watch\'s night temperature and your deep sleep, {n} nights.', { n: r.nights }) : tr('From your own "how was the room" taps, {n} nights.', { n: r.nights })}</Text>
        </>
      ) : <Text style={{ color: colors.muted, fontSize: 13 }}>{tr('After {n} nights with sleep stages, Myra shows how room warmth changes your deep sleep.', { n: NEED })}</Text>}
      {asked ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{tr('How was the room?')}</Text>
          {ROOM.map(([id, icon, label]) => {
            const on = day.sleep.room === id;
            return (
              <Pressable key={id} onPress={() => update(d => { d.sleep.room = on ? undefined : id; })} accessibilityRole="button" accessibilityState={{ selected: on }}
                style={{ borderRadius: 99, borderWidth: 1, borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.accent : colors.surface, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: on ? colors.onAccent : colors.ink, fontSize: 13 }}>{icon} {tr(label)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
