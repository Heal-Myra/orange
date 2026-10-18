// Today's Tao Te Ching practice (one per weekday), with a private note and a tick.
// Each practice belongs to Mind or Soul (src/lib/tao.ts). The full card shows on that tab;
// the other tab shows a one-line pointer.

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useHeal } from '../lib/store';
import { TAO_CORE, TAO_POINTS, TAO_WEEK, WEEK_REVIEW, mondayOf, taoForDate } from '../lib/tao';
import { colors } from '../theme';
import { Card, Check, Heading, Label, Note, TextField } from './ui';

const NAME = { mind: 'Mind', soul: 'Soul' } as const;

export function TaoCard({ on }: { on: 'mind' | 'soul' }) {
  const { day, date, days, update } = useHeal();
  const [week, setWeek] = useState(false);
  const t = taoForDate(date);
  const color = t.pillar === 'mind' ? colors.mind : colors.soul;

  if (t.pillar !== on) {
    return (
      <Pressable onPress={() => router.navigate(t.pillar === 'mind' ? '/mind' : '/soul')}>
        <Card>
          <Label>Tao practice · {t.day}</Label>
          <Text style={{ color: colors.ink }}>{t.title}{day.tao?.done ? ' ✓ done' : ''}</Text>
          <Note>Today's practice is on the {NAME[t.pillar]} tab ›</Note>
        </Card>
      </Pressable>
    );
  }

  const monday = mondayOf(date);
  const mondayNote = monday !== date ? days[monday]?.tao?.note : undefined;

  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: color }}>
      <Label>Tao practice · {t.day}</Label>
      <Heading>{t.title}</Heading>
      {t.practice.map((p, i) => <Text key={i} style={{ color: colors.ink, lineHeight: 22 }}>{p}</Text>)}

      {t.weekday === 3 && mondayNote ? <Note>Your Monday note: {mondayNote}</Note> : null}

      <TextField key={date + 'tao'} label="My note (private)" value={day.tao?.note ?? ''} multiline
        onChangeText={v => update(d => { d.tao = { ...d.tao, note: v }; })} placeholder={t.notePrompt} />

      <Check color={color} checked={!!day.tao?.done} onToggle={() => update(d => { d.tao = { ...d.tao, done: !d.tao?.done }; })}
        title="I did today's practice" points={TAO_POINTS} />

      {t.weekday === 0 && (
        <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}>
          <Label>End of the week</Label>
          <Text style={{ color: colors.ink, lineHeight: 21 }}>{WEEK_REVIEW.intro}</Text>
          {WEEK_REVIEW.cracks.map((c, i) => <Text key={i} style={{ color: colors.ink }}>• {c}</Text>)}
          <Note>{mondayNote ? `Your Monday list: ${mondayNote}` : 'No Monday note this week. Next Monday, try writing down what you are trying to grab.'}</Note>
        </View>
      )}

      <Note>{TAO_CORE.summary}</Note>
      <Pressable onPress={() => setWeek(w => !w)}>
        <Text style={{ color: colors.accent, fontWeight: '600' }}>{week ? 'Hide the week' : 'See the whole week'}</Text>
      </Pressable>
      {week && <TaoWeek compact />}
    </Card>
  );
}

/** The seven practices; used inside the daily card and in the Library. */
export function TaoWeek({ compact }: { compact?: boolean }) {
  return (
    <View style={{ gap: 10 }}>
      {TAO_WEEK.map(t => (
        <View key={t.day} style={{ gap: 3, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
          <Text style={{ fontWeight: '600', color: colors.ink }}>{t.day}: {t.title} <Text style={{ color: t.pillar === 'mind' ? colors.mind : colors.soul, fontWeight: '400' }}>({NAME[t.pillar]})</Text></Text>
          {(compact ? t.practice.slice(0, 1) : t.practice).map((p, i) => <Text key={i} style={{ color: colors.ink, lineHeight: 21 }}>{p}</Text>)}
        </View>
      ))}
    </View>
  );
}
