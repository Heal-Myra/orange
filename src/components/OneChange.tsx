// The 30-day one-change test on Today (founder, 10 Nov 2026), folded into one row: pick one change, tap Kept today or
// Not today once a day, and on day 30 see what moved (sleep, Body score, My day, mood) against the 14 days before.
// Myra coordinates: the change can touch any specialist, so it lives on Today, not in one pillar.

import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { IDEAS, LENGTH, dayOf, grid, result } from '../lib/oneChange';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Expandable } from './ui';

const chip = (label: string, onPress: () => void, on = false) => (
  <Pressable key={label} onPress={onPress} accessibilityRole="button"
    style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 99, borderWidth: 1, borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.accent : colors.surface }}>
    <Text style={{ color: on ? '#fff' : colors.ink, fontWeight: '600', fontSize: 13.5 }}>{label}</Text>
  </Pressable>
);

export function OneChange() {
  const { days, day, profile, setProfile, update } = useHeal();
  const [text, setText] = useState('');
  const today = todayISO();
  const me = profile.me;
  const t = me?.oneChange && !me.oneChange.ended ? me.oneChange : null;
  const setTest = (v: typeof t | undefined) => { if (me) setProfile({ ...profile, me: { ...me, oneChange: v ?? undefined } }); };
  const n = t ? dayOf(t.start, today) : 0;
  if (!me) return null; // About you first: the test is kept with it, so it syncs
  const status = !t ? tr('Pick one change for 30 days') : n > LENGTH ? tr('{c} · see what changed', { c: t.change }) : tr('{c} · Day {n} of 30', { c: t.change, n });

  return (
    <Card style={{ paddingVertical: 4 }}>
      <View style={{ marginTop: -1 }}>
        <Expandable icon="flask-outline" title={tr('30-day test')} status={status} color={colors.insight}>
          {!t ? (
            <View style={{ gap: 10, paddingBottom: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 13.5 }}>{tr('One change, one tap a day. On day 30 Myra shows what moved in your sleep, scores and mood.')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{IDEAS.map(i => chip(tr(i), () => setText(tr(i)), text === tr(i)))}</View>
              <TextInput value={text} onChangeText={setText} placeholder={tr('Or write your own')} placeholderTextColor={colors.muted}
                style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 10, fontSize: 15, color: colors.ink, backgroundColor: colors.surface }} />
              <Button title={tr('Start today')} disabled={!text.trim()} onPress={() => { setTest({ change: text.trim().slice(0, 60), start: today }); setText(''); }} />
            </View>
          ) : (
            <Running days={days} answer={day.oneChange} n={n} start={t.start}
              onAnswer={a => update(d => { d.oneChange = d.oneChange === a ? undefined : a; })}
              onEnd={() => setTest({ ...t, ended: today })} result={n >= LENGTH ? result(days, t.start, profile) : null} />
          )}
        </Expandable>
      </View>
    </Card>
  );
}

function Running({ days, answer, n, start, onAnswer, onEnd, result: r }: {
  days: ReturnType<typeof useHeal>['days']; answer?: 'yes' | 'no'; n: number; start: string;
  onAnswer: (a: 'yes' | 'no') => void; onEnd: () => void; result: ReturnType<typeof result> | null;
}) {
  const g = grid(days, start);
  const fmt = (v: number | null, kind: 'h' | 'n' | 'mood') => v == null ? '–' : kind === 'h' ? `${Math.floor(v)} h ${String(Math.round((v % 1) * 60)).padStart(2, '0')}` : kind === 'mood' ? `${Math.round(v * 10) / 10} / 5` : String(Math.round(v));
  const row = (label: string, a: number | null, b: number | null, kind: 'h' | 'n' | 'mood') => (
    <View key={label} style={{ flexDirection: 'row', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Text style={{ flex: 1, color: colors.ink, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.ink, fontSize: 14 }}>{fmt(a, kind)} → <Text style={{ fontWeight: '700', color: a != null && b != null && b > a ? colors.good : colors.ink }}>{fmt(b, kind)}</Text></Text>
    </View>
  );
  const better = r ? [[r.before.sleep, r.after.sleep], [r.before.body, r.after.body], [r.before.day, r.after.day], [r.before.mood, r.after.mood]]
    .filter(([a, b]) => a != null && b != null && (b as number) > (a as number) * 1.03).length : 0;
  return (
    <View style={{ gap: 10, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {g.map((a, i) => <View key={i} style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: a === 'yes' ? colors.accent : a === 'no' ? '#F0D9D2' : i < n ? colors.line : '#DCEBEC66' }} />)}
      </View>
      {n <= LENGTH ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {chip(`✓ ${tr('Kept today')}`, () => onAnswer('yes'), answer === 'yes')}
          {chip(tr('Not today'), () => onAnswer('no'), answer === 'no')}
        </View>
      ) : null}
      {r ? (
        <View style={{ gap: 2, marginTop: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 12.5, fontWeight: '700', letterSpacing: 0.4 }}>{tr('BEFORE → LAST 14 DAYS · kept {k} of 30', { k: r.kept })}</Text>
          {row(tr('Sleep'), r.before.sleep, r.after.sleep, 'h')}
          {row(tr('Body score'), r.before.body, r.after.body, 'n')}
          {row(tr('My day'), r.before.day, r.after.day, 'n')}
          {row(tr('Mood'), r.before.mood, r.after.mood, 'mood')}
          <Text style={{ color: colors.insight, fontSize: 14, marginTop: 6 }}>✦ {better >= 2 ? tr('It helped you. Keep it, or pick your next change.') : tr('Not much moved yet. Try another change, or keep going.')}</Text>
        </View>
      ) : null}
      <Pressable onPress={onEnd} accessibilityRole="button"><Text style={{ color: colors.muted, fontSize: 13 }}>{r ? tr('Done · pick a new change') : tr('Stop this test')}</Text></Pressable>
    </View>
  );
}
