// Today's Tao Te Ching practice (one per weekday), with a private note and a tick.
// Each practice belongs to Mind or Soul (src/lib/tao.ts). The full card shows on that tab;
// the other tab shows a one-line pointer.

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useHeal } from '../lib/store';
import { LEARN_SHARE } from '../lib/scoring';
import { TAO_CORE, TAO_POINTS, TAO_WEEK, WEEK_REVIEW, mondayOf, taoForDate } from '../lib/tao';
import { colors } from '../theme';
import { Card, Check, Expandable, Heading, Label, Note, TextField } from './ui';
import { tr } from '../lib/i18n';

const NAME = { mind: 'Mind', soul: 'Soul' } as const;

export function TaoCard({ on }: { on: 'mind' | 'soul' }) {
  const { day, date, days, update } = useHeal();
  const [week, setWeek] = useState(false);
  const [more, setMore] = useState(false);
  const t = taoForDate(date);
  const color = t.pillar === 'mind' ? colors.mind : colors.soul;

  if (t.pillar !== on) {
    return (
      <Pressable onPress={() => router.navigate(t.pillar === 'mind' ? '/mind' : '/soul')}>
        <Card>
          <Label>{tr('Tao practice')} · {tr(t.day)}</Label>
          <Text style={{ color: colors.ink }}>{tr(t.title)}{day.tao?.done ? ` ✓ ${tr('done')}` : ''}</Text>
          <Note>{tr("Today's practice is on the {tab} tab ›", { tab: tr(NAME[t.pillar]) })}</Note>
        </Card>
      </Pressable>
    );
  }

  const monday = mondayOf(date);
  const mondayNote = monday !== date ? days[monday]?.tao?.note : undefined;

  // Compact (founder, 21 Oct 2026): about the size of "Clear your mind". One-sentence practice, the note and the tick;
  // the full text, the Sunday review and the week are one tap away.
  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: color }}>
      <Label>{tr('Tao practice')} · {tr(t.day)}</Label>
      <Heading>{tr(t.title)}</Heading>
      <Text style={{ color: colors.ink, lineHeight: 22 }}>{tr(t.short)}</Text>
      {t.weekday === 3 && mondayNote ? <Note>{tr('Your Monday note: {note}', { note: mondayNote })}</Note> : null}

      <Expandable icon="create-outline" title={tr('My note (private)')} status={day.tao?.note?.trim() ? day.tao.note.trim() : tr('Optional')}>
        <TextField key={date + 'tao'} label={tr('My note (private)')} value={day.tao?.note ?? ''} multiline
          onChangeText={v => update(d => { d.tao = { ...d.tao, note: v }; })} placeholder={tr(t.notePrompt)} />
      </Expandable>

      <Check color={color} checked={!!day.tao?.done} onToggle={() => update(d => { d.tao = { ...d.tao, done: !d.tao?.done }; })}
        title={tr('I read today\'s practice')} points={LEARN_SHARE * TAO_POINTS} />
      {/* Living it earns the other 75 % (founder, 26 Oct 2026). */}
      <TextField key={date + 'taolived'} label={tr('How I lived it today · {n} points', { n: (1 - LEARN_SHARE) * TAO_POINTS })} value={day.tao?.lived ?? ''} multiline
        onChangeText={v => update(d => { d.tao = { ...d.tao, lived: v }; })} placeholder={tr('e.g. I let go of being right in a family discussion.')} />

      <Pressable onPress={() => setMore(m => !m)} hitSlop={6}>
        <Text style={{ color: colors.accent, fontWeight: '600' }}>{more ? tr('Show less') : tr('Read the full practice')}</Text>
      </Pressable>
      {more ? (
        <View style={{ gap: 8 }}>
          {t.practice.map((p, i) => <Text key={i} style={{ color: colors.ink, lineHeight: 22 }}>{tr(p)}</Text>)}
          {t.weekday === 0 && (
            <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}>
              <Label>{tr('End of the week')}</Label>
              <Text style={{ color: colors.ink, lineHeight: 21 }}>{tr(WEEK_REVIEW.intro)}</Text>
              {WEEK_REVIEW.cracks.map((c, i) => <Text key={i} style={{ color: colors.ink }}>• {tr(c)}</Text>)}
              <Note>{mondayNote ? tr('Your Monday list: {note}', { note: mondayNote }) : tr('No Monday note this week. Next Monday, try writing down what you are trying to grab.')}</Note>
            </View>
          )}
          <Note>{tr(TAO_CORE.summary)}</Note>
          <Pressable onPress={() => setWeek(w => !w)}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>{week ? tr('Hide the week') : tr('See the whole week')}</Text>
          </Pressable>
          {week && <TaoWeek compact />}
        </View>
      ) : null}
    </Card>
  );
}

/** The seven practices; used inside the daily card and in the Library. */
export function TaoWeek({ compact }: { compact?: boolean }) {
  return (
    <View style={{ gap: 10 }}>
      {TAO_WEEK.map(t => (
        <View key={t.day} style={{ gap: 3, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
          <Text style={{ fontWeight: '600', color: colors.ink }}>{tr(t.day)}: {tr(t.title)} <Text style={{ color: t.pillar === 'mind' ? colors.mind : colors.soul, fontWeight: '400' }}>({tr(NAME[t.pillar])})</Text></Text>
          {(compact ? t.practice.slice(0, 1) : t.practice).map((p, i) => <Text key={i} style={{ color: colors.ink, lineHeight: 21 }}>{tr(p)}</Text>)}
        </View>
      ))}
    </View>
  );
}
