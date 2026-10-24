// "How do you feel today?" on Today (founder, 24 Oct 2026): one text box, in the person's own words. Symptoms and mood are
// read from the words (src/lib/feeling.ts); then it folds into one line, and Myra fits every suggestion to it.

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { shiftISO } from '../lib/dates';
import { MOODS, SYMPTOMS, symptomsIn, type Feeling, type Mood, type Symptom } from '../lib/feeling';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Expandable, Note, TextField } from './ui';

export function FeelingCard() {
  const { day, days, date, update } = useHeal();
  const f = day.feeling;
  const before = days[shiftISO(date, -1)]?.feeling;
  const [note, setNote] = useState(f?.note ?? '');
  const [editing, setEditing] = useState(false);

  const save = (m: Mood | null, s: Symptom[], n: string) => {
    // Words count too (founder, 24 Oct 2026): "I have a cold" ticks Cold by itself.
    const all = Array.from(new Set([...s, ...symptomsIn(n)]));
    const happy = /\b(great|good|fine|happy|fresh|energetic|well)\b|अच्छा|बढ़िया|ठीक/i.test(n) && !/\bnot\b|नहीं/i.test(n);
    const mood: Mood = m ?? (all.some(x => !['stressed', 'sleepless', 'tired'].includes(x)) ? 'unwell' : all.length ? 'low' : happy ? 'good' : 'okay');
    update(d => { d.feeling = { mood, symptoms: all, note: n.trim() || undefined, at: new Date().toISOString() } as Feeling; });
    setEditing(false);
  };

  const summary = f ? (f.note?.trim() || [tr(MOODS.find(x => x.id === f.mood)!.label), ...f.symptoms.map(s => tr(SYMPTOMS.find(x => x.id === s)!.label))].join(' · ')) : '';
  const unwell = f && (f.mood === 'unwell' || f.mood === 'low' || f.symptoms.length > 0);

  // Just the words (founder, 24 Oct 2026: no buttons). Symptoms and mood are read from what is written.
  const picker = (
    <View style={{ gap: 10 }}>
      <TextField label={tr('In your own words')} value={note} onChangeText={setNote} multiline placeholder={tr('e.g. I have a cold since last night, a little tired')} />
      {note.trim() ? <Button kind="insight" title={tr('Done')} onPress={() => save(null, [], note)} /> : null}
    </View>
  );

  // Answered: one line that folds open to change it.
  if (f && !editing) {
    return (
      <Card style={{ paddingVertical: 4 }}>
        <Expandable icon={unwell ? 'medkit-outline' : 'happy-outline'} color={colors.insight} title={tr('How I feel today')} status={summary} open={false} onToggle={() => setEditing(true)}>
          {null}
        </Expandable>
        {unwell ? <Note>{tr('Myra is fitting today\'s suggestions to this.')}</Note> : null}
        {f.symptoms.includes('fever') ? <Note>{tr('See a doctor if the fever lasts over 3 days, is very high, or comes with breathlessness, a rash or a stiff neck.')}</Note> : null}
      </Card>
    );
  }

  return (
    <Card style={{ gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>{tr('How do you feel today?')}</Text>
      {/* Yesterday's trouble: one tap if it is the same today. */}
      {!f && before && before.symptoms.length ? (
        <Pressable onPress={() => save(before.mood, before.symptoms, before.note ?? '')} accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, backgroundColor: colors.insight + '10' }}>
          <Ionicons name="repeat" size={18} color={colors.insight} />
          <Text style={{ color: colors.ink, flex: 1 }}>{tr('Still the same as yesterday: {what}', { what: before.symptoms.map(s => tr(SYMPTOMS.find(x => x.id === s)!.label)).join(', ') })}</Text>
        </Pressable>
      ) : null}
      {picker}
      {editing ? <Pressable onPress={() => setEditing(false)}><Text style={{ color: colors.accent, textAlign: 'center' }}>{tr('Cancel')}</Text></Pressable> : null}
    </Card>
  );
}
