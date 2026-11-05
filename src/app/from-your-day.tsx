// Review what NeoSapien heard (decision 0050): ✓ to add, ✕ to skip, for each journal line and to-do. Nothing is added
// without a yes, and a journal box you already filled is never replaced.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NsPill } from '../components/FromYourDay';
import { Button, Card, Note } from '../components/ui';
import { todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { applyJournal, suggestions } from '../lib/neosapien';
import { useHeal } from '../lib/store';
import { useTasks, type Area } from '../lib/tasks';
import { colors } from '../theme';

const LABEL = { thankful: 'Thankful for', laugh: 'Made me laugh', kind: 'I was kind to', best: 'Best part of my day' } as const;

export default function FromYourDayScreen() {
  const { date: dParam } = useLocalSearchParams<{ date?: string }>();
  const date = dParam || todayISO();
  const { days, updateOn } = useHeal();
  const { add } = useTasks();
  const f = days[date]?.fromDay;
  const list = suggestions(f);
  const [pick, setPick] = useState<Record<string, boolean>>(() => Object.fromEntries(list.map(s => [s.key, f?.decided?.[s.key] !== 'no'])));
  const t = f?.tone;
  const save = () => {
    const decided: Record<string, 'yes' | 'no'> = { ...(f?.decided ?? {}) };
    updateOn(date, d => {
      for (const s of list) {
        if (decided[s.key]) continue; // already decided earlier
        decided[s.key] = pick[s.key] ? 'yes' : 'no';
        if (pick[s.key] && s.kind !== 'todo') applyJournal(d, s.kind, s.text);
      }
      if (d.fromDay) d.fromDay = { ...d.fromDay, decided };
    });
    for (const s of list) if (pick[s.key] && s.kind === 'todo' && f?.decided?.[s.key] !== 'yes') add(s.text, (s.area ?? 'work') as Area);
    router.back();
  };
  const row = (s: typeof list[number]) => {
    const done = f?.decided?.[s.key];
    const on = pick[s.key];
    return (
      <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.line }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.ink, fontSize: 15 }}>{s.kind === 'todo' ? s.text : `${tr(LABEL[s.kind])}: ${s.text}`}</Text>
          {s.kind === 'todo' ? <Text style={{ color: colors.muted, fontSize: 12 }}>{tr(s.area === 'family' ? 'Family' : s.area === 'self' ? 'Better me' : 'Work')}</Text> : null}
        </View>
        {done ? <Text style={{ color: colors.muted, fontSize: 13 }}>{done === 'yes' ? tr('Added') : tr('Skipped')}</Text> : (
          <>
            <Pressable onPress={() => setPick(p => ({ ...p, [s.key]: false }))} accessibilityLabel={tr('Skip')} hitSlop={6}
              style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.surface : '#EEF2F3' }}>
              <Ionicons name="close" size={16} color={on ? colors.muted : colors.ink} />
            </Pressable>
            <Pressable onPress={() => setPick(p => ({ ...p, [s.key]: true }))} accessibilityLabel={tr('Add')} hitSlop={6}
              style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.accent : colors.surface, borderWidth: on ? 0 : 1, borderColor: colors.line }}>
              <Ionicons name="checkmark" size={17} color={on ? '#fff' : colors.muted} />
            </Pressable>
          </>
        )}
      </View>
    );
  };
  const journal = list.filter(s => s.kind !== 'todo'), todos = list.filter(s => s.kind === 'todo');
  const label = { fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.5, color: colors.muted };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, color: colors.muted }}>{date}</Text><NsPill />
      </View>
      {journal.length ? <Card style={{ gap: 0 }}><Text style={label}>{tr('JOURNAL · SOUL')}</Text>{journal.map(row)}</Card> : null}
      {todos.length ? <Card style={{ gap: 0 }}><Text style={label}>{tr('TO-DOS FOR YOU · CLEAR YOUR MIND')}</Text>{todos.map(row)}</Card> : null}
      {t ? (
        <Card style={{ gap: 6 }}>
          <Text style={label}>{tr('TONE OF THE DAY · MIND')}</Text>
          {t.line ? <Text style={{ color: colors.ink, fontSize: 15, lineHeight: 21 }}>{t.line}</Text> : null}
          <Note>{tr('{n} conversations · {c} calm, {t} tense. For Myra\'s advice only; no points.', { n: t.count, c: t.calm, t: t.tense })}</Note>
        </Card>
      ) : null}
      {!list.length ? <Note>{tr('Nothing to add from this day yet.')}</Note> : <Button title={tr('Add the ✓ ones')} onPress={save} />}
      <Note>{tr('Only these short lines come from NeoSapien. Transcripts and business details stay with NeoSapien.')}</Note>
    </ScrollView>
  );
}
