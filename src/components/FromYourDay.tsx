// "From your day" on Today (founder, 6 Nov 2026; decision 0050): what Neo 1 heard today, as one small card.
// From 18 Nov 2026 (founder, decision 0060: "no manual entry other than phone usage and the face picture") everything
// NeoSapien heard is added at once: journal lines (empty boxes only), to-dos, meals said aloud (read by Myra, IFCT where
// it can), a fast, how the Gita and Tao were lived, measures and fitness numbers. Change or remove any of it in details.

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { shiftISO, todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { applyJournal, extras, fetchDay, pending, useNeoSapien } from '../lib/neosapien';
import { analyseMealText, rateLived } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { verseOfDay } from '../lib/gita';
import { passageOfDay } from '../lib/wisdom';
import { taoForDate } from '../lib/tao';
import { useTasks, type Area } from '../lib/tasks';
import type { Meal } from '../lib/types';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Card } from './ui';

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
  const { days, updateOn, profile, setProfile } = useHeal();
  const { tradition } = useAuth();
  const { add } = useTasks();
  const date = fromDayDate(days);
  const f = days[date]?.fromDay;
  const busy = useRef(false), filling = useRef(false);
  const teach = () => {
    const p = passageOfDay(tradition ?? 'hindu', date), v = verseOfDay(date), t = taoForDate(date);
    return { gita: p?.english ?? p?.original ?? `Bhagavad Gita ${v.chapter}.${v.verse}: ${v.transliteration}`, tao: t ? `${t.title}: ${t.short}` : '' };
  };

  // Fill the day with what NeoSapien heard, once per item (its key is marked decided 'yes').
  useEffect(() => {
    if (!f || filling.current) return;
    const journal = pending(f), more = extras(f);
    if (!journal.length && !more.length) return;
    filling.current = true;
    (async () => {
      const done: Record<string, 'yes'> = {};
      const meals: Meal[] = [];
      for (const m of more.filter(x => x.kind === 'meal')) {
        if (m.kind !== 'meal') continue;
        try {
          const r = await analyseMealText(m.text);
          const at = m.at ? new Date(`${date}T${m.at}:00`).toISOString() : undefined;
          for (const it of r.items) meals.push({ name: it.name, grams: it.grams, kcal: it.kcal, p: it.protein_g, c: it.carbs_g, f: it.fat_g, fib: it.fibre_g ?? 0,
            source: it.basis === 'IFCT' ? 'words+ifct' : 'words', neo: true, ...(at ? { at } : {}) });
          done[m.key] = 'yes';
        } catch { /* try again on the next visit */ }
      }
      const lived: { gita?: string; tao?: string } = {};
      updateOn(date, d => {
        for (const s of journal) { if (s.kind !== 'todo') applyJournal(d, s.kind, s.text); done[s.key] = 'yes'; }
        if (meals.length) d.meals.push(...meals);
        for (const x of more) {
          if (x.kind === 'fasting') { d.fasting = true; done[x.key] = 'yes'; }
          else if (x.kind === 'gita') { if (!d.soul?.verseLived?.trim()) { d.soul = { ...d.soul, verseLived: x.text }; lived.gita = x.text; } done[x.key] = 'yes'; }
          else if (x.kind === 'tao') { if (!d.tao?.lived?.trim()) { d.tao = { ...d.tao, lived: x.text }; lived.tao = x.text; } done[x.key] = 'yes'; }
          else if (x.kind === 'measure') {
            d.health = { ...(d.health ?? {}), ...(x.waist && d.health?.waistCm == null ? { waistCm: x.waist } : {}), ...(x.hips && d.health?.hipsCm == null ? { hipsCm: x.hips } : {}) };
            done[x.key] = 'yes';
          }
        }
        if (d.fromDay) d.fromDay = { ...d.fromDay, decided: { ...(d.fromDay.decided ?? {}), ...done } };
      });
      for (const s of journal) if (s.kind === 'todo') add(s.text, (s.area ?? 'work') as Area);
      const fit = more.find(x => x.kind === 'fitness');
      if (fit && fit.kind === 'fitness' && profile.me) {
        const v = Object.fromEntries(Object.entries(fit.v).filter(([, n]) => n != null));
        const others = (profile.me.fitness ?? []).filter(r => r.date !== date), mine = (profile.me.fitness ?? []).find(r => r.date === date);
        setProfile({ ...profile, me: { ...profile.me, fitness: [...others, { ...v, ...mine, date }].sort((a, b) => a.date.localeCompare(b.date)) } });
        updateOn(date, d => { if (d.fromDay) d.fromDay = { ...d.fromDay, decided: { ...(d.fromDay.decided ?? {}), fitness: 'yes' } }; });
      }
      // Myra reads how deeply each teaching was lived (decision of 16 Nov 2026), so the points are right straight away.
      const T = teach();
      if (lived.gita) rateLived(T.gita, lived.gita).then(r => updateOn(date, d => { d.soul = { ...d.soul, verseLivedRate: { of: lived.gita!.trim(), level: Math.max(0, Math.min(3, Math.round(Number(r.level) || 0))) as 0 | 1 | 2 | 3, line: String(r.line ?? '') } }; })).catch(() => {});
      if (lived.tao) rateLived(T.tao, lived.tao).then(r => updateOn(date, d => { d.tao = { ...d.tao, livedRate: { of: lived.tao!.trim(), level: Math.max(0, Math.min(3, Math.round(Number(r.level) || 0))) as 0 | 1 | 2 | 3, line: String(r.line ?? '') } }; })).catch(() => {});
    })().finally(() => { filling.current = false; });
  }, [f?.fetchedAt, f && Object.keys(f.decided ?? {}).length]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(useCallback(() => {
    if (!connected || busy.current) return;
    if (f?.fetchedAt && Date.now() - Date.parse(f.fetchedAt) < 30 * 60_000) return;
    busy.current = true;
    fetchDay(date, profile.me?.name, teach()).then(r => { if (r) updateOn(date, d => { d.fromDay = { ...r, decided: d.fromDay?.decided }; }); })
      .catch(() => {}).finally(() => { busy.current = false; });
  }, [connected, date, f?.fetchedAt])); // eslint-disable-line react-hooks/exhaustive-deps
  if (!connected || !f || f.empty) return null;
  const d = f.decided ?? {};
  const added = (prefix: string) => Object.keys(d).filter(k => k.startsWith(prefix) && d[k] === 'yes').length;
  const line = (icon: string, bold: string, rest: string) => (
    <Text style={{ fontSize: 14, color: colors.ink, lineHeight: 20 }}>{icon} <Text style={{ fontWeight: '700' }}>{bold}</Text> {rest}</Text>
  );
  const t = f.tone;
  const parts = [
    added('meal.') ? tr('{n} meals', { n: added('meal.') }) : null,
    added('todo.') ? tr('{n} to-dos', { n: added('todo.') }) : null,
    ['thankful', 'laugh', 'kind', 'best'].reduce((n, k) => n + added(k), 0) ? tr('{n} journal lines', { n: ['thankful', 'laugh', 'kind', 'best'].reduce((n, k) => n + added(k), 0) }) : null,
    added('lived.') ? tr('how you lived the wisdom') : null,
    d.fasting === 'yes' ? tr('your fast') : null,
    d.measure === 'yes' ? tr('your measures') : null,
    d.fitness === 'yes' ? tr('your fitness test') : null,
  ].filter(Boolean) as string[];
  return (
    <Card style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.ink }}>{date === todayISO() ? tr('From your day') : tr('From yesterday')}</Text>
        <NsPill />
      </View>
      {t ? line('🌤', tr('Tone:'), [tr('{h} of talk', { h: hm(t.talkMin) }), t.workMin > t.talkMin * 0.6 ? tr('mostly work') : null, t.tense ? tr('{n} tense', { n: t.tense }) + (t.tenseLate ? ` · ${tr('{n} after 4 pm', { n: t.tenseLate })}` : '') : tr('calm')].filter(Boolean).join(' · ')) : null}
      {parts.length ? line('✓', tr('Added:'), parts.join(' · ')) : <Text style={{ color: colors.muted, fontSize: 13 }}>{tr('Nothing to add yet. Say "Happy Orange, lunch was…" to Neo.')}</Text>}
      {parts.length ? <Text style={{ color: colors.muted, fontSize: 12.5 }}>{tr('Change or remove any of it in details.')}</Text> : null}
    </Card>
  );
}
