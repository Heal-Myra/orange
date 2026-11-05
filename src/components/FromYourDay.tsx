// "From your day" on Today (founder, 6 Nov 2026; decision 0050): what Neo 1 heard today, as one small card: the tone of
// the day, to-dos waiting for a yes, and journal lines ready. Review opens the yes/no list. Shows only when NeoSapien
// is connected and has something; in the morning (before 11) it shows yesterday's, if not reviewed yet.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { shiftISO, todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { fetchDay, pending, suggestions, useNeoSapien } from '../lib/neosapien';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card } from './ui';

export const NS_GREEN = '#3C8C5A';
export const NsPill = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: NS_GREEN + '14', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
    <Text style={{ color: NS_GREEN, fontSize: 11, fontWeight: '700' }}>● NeoSapien</Text>
  </View>
);
const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 >= 10 ? ` ${min % 60}` : ''}` : `${min} min`);

/** Which day the card is about: yesterday in the early morning if it still has something to review, else today. */
export function fromDayDate(days: Record<string, { fromDay?: unknown } | undefined>) {
  const today = todayISO(), y = shiftISO(today, -1);
  const yd = days[y]?.fromDay as Parameters<typeof pending>[0];
  return new Date().getHours() < 11 && (!yd || pending(yd).length) ? y : today;
}

export function FromYourDay() {
  const { connected } = useNeoSapien();
  const { days, updateOn, profile } = useHeal();
  const date = fromDayDate(days);
  const f = days[date]?.fromDay;
  const busy = useRef(false);
  useFocusEffect(useCallback(() => {
    if (!connected || busy.current) return;
    if (f?.fetchedAt && Date.now() - Date.parse(f.fetchedAt) < 30 * 60_000) return;
    busy.current = true;
    fetchDay(date, profile.me?.name).then(r => { if (r) updateOn(date, d => { d.fromDay = { ...r, decided: d.fromDay?.decided }; }); })
      .catch(() => {}).finally(() => { busy.current = false; });
  }, [connected, date, f?.fetchedAt])); // eslint-disable-line react-hooks/exhaustive-deps
  if (!connected || !f || f.empty) return null;
  const left = pending(f), todos = left.filter(x => x.kind === 'todo').length, journal = left.filter(x => x.kind !== 'todo').length;
  const all = suggestions(f).length;
  const line = (icon: string, bold: string, rest: string) => (
    <Text style={{ fontSize: 14, color: colors.ink, lineHeight: 20 }}>{icon} <Text style={{ fontWeight: '700' }}>{bold}</Text> {rest}</Text>
  );
  const t = f.tone;
  return (
    <Card style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.ink }}>{date === todayISO() ? tr('From your day') : tr('From yesterday')}</Text>
        <NsPill />
      </View>
      {t ? line('🌤', tr('Tone:'), [tr('{h} of talk', { h: hm(t.talkMin) }), t.workMin > t.talkMin * 0.6 ? tr('mostly work') : null, t.tense ? tr('{n} tense', { n: t.tense }) + (t.tenseLate ? ` · ${tr('{n} after 4 pm', { n: t.tenseLate })}` : '') : tr('calm')].filter(Boolean).join(' · ')) : null}
      {todos ? line('✅', tr('{n} to-dos', { n: todos }), tr('for you, waiting for a yes')) : null}
      {journal ? line('🙏', tr('Journal:'), tr('{n} lines ready', { n: journal })) : null}
      {left.length ? <Button title={tr('Review · 1 minute')} onPress={() => router.push({ pathname: '/from-your-day', params: { date } })} />
        : all ? <Pressable onPress={() => router.push({ pathname: '/from-your-day', params: { date } })}><Text style={{ color: colors.muted, fontSize: 13 }}>{tr('Reviewed ✓ · see again')}</Text></Pressable> : null}
    </Card>
  );
}
