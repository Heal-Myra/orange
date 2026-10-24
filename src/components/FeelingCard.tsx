// "How do you feel today?" on Today (founder, 24 Oct 2026). One tap for the mood; if not great, a few taps for what
// is wrong (cold, fever, tired…). Then it folds into one line, and Myra fits every suggestion to it.

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { shiftISO } from '../lib/dates';
import { MOODS, SYMPTOMS, type Feeling, type Mood, type Symptom } from '../lib/feeling';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Expandable, Note, TextField } from './ui';

export function FeelingCard() {
  const { day, days, date, update } = useHeal();
  const f = day.feeling;
  const before = days[shiftISO(date, -1)]?.feeling;
  const [mood, setMood] = useState<Mood | null>(f?.mood ?? null);
  const [sym, setSym] = useState<Symptom[]>(f?.symptoms ?? []);
  const [note, setNote] = useState(f?.note ?? '');
  const [editing, setEditing] = useState(false);

  const save = (m: Mood, s: Symptom[], n: string) => {
    update(d => { d.feeling = { mood: m, symptoms: s, note: n.trim() || undefined, at: new Date().toISOString() } as Feeling; });
    setEditing(false);
  };
  const choose = (m: Mood) => {
    setMood(m);
    if (m === 'great' || m === 'good') { setSym([]); save(m, [], ''); }
  };

  const summary = f ? [tr(MOODS.find(x => x.id === f.mood)!.label), ...f.symptoms.map(s => tr(SYMPTOMS.find(x => x.id === s)!.label))].join(' · ') : '';
  const unwell = f && (f.mood === 'unwell' || f.mood === 'low' || f.symptoms.length > 0);

  const picker = (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {MOODS.map(m => {
          const on = mood === m.id;
          return (
            <Pressable key={m.id} onPress={() => choose(m.id)} accessibilityRole="button" accessibilityState={{ selected: on }}
              style={{ alignItems: 'center', gap: 4, paddingVertical: 8, width: 62, borderRadius: 14, borderWidth: 1,
                borderColor: on ? colors.insight : colors.line, backgroundColor: on ? colors.insight + '12' : colors.surface }}>
              <Ionicons name={m.icon as keyof typeof Ionicons.glyphMap} size={22} color={on ? colors.insight : colors.muted} />
              <Text style={{ fontSize: 12, color: colors.ink }}>{tr(m.label)}</Text>
            </Pressable>
          );
        })}
      </View>
      {mood && mood !== 'great' && mood !== 'good' ? (
        <>
          <Text style={{ color: colors.ink }}>{tr('Anything bothering you?')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {SYMPTOMS.map(s => {
              const on = sym.includes(s.id);
              return (
                <Pressable key={s.id} onPress={() => setSym(l => (on ? l.filter(x => x !== s.id) : [...l, s.id]))}
                  style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: on ? colors.insight : colors.line, backgroundColor: on ? colors.insight + '12' : colors.surface }}>
                  <Text style={{ color: colors.ink, fontSize: 13 }}>{tr(s.label)}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextField label={tr('Anything else (optional)')} value={note} onChangeText={setNote} placeholder={tr('e.g. blocked nose since last night')} />
          <Button kind="insight" title={tr('Done')} onPress={() => save(mood, sym, note)} />
        </>
      ) : null}
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
