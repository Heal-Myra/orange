// Soul tab cards: Gita verse to study, thought of the day, gratitude, and one simple check for the eight practices.
// Points (docs/scoring.md): practices 40, meditation 20, verse 15, gratitude 5 each up to 15, thought 10.

import { Pressable, Text, View } from 'react-native';
import { verseOfDay } from '../lib/gita';
import { PRACTICES } from '../lib/scoring';
import { useHeal } from '../lib/store';
import { thoughtOfDay } from '../lib/thoughts';
import { colors } from '../theme';
import { ExplainVerse } from './AiBits';
import { Button, Card, Check, Heading, Label, Note, TextField } from './ui';

export function VerseStudyCard() {
  const { day, date, update } = useHeal();
  const v = verseOfDay(date);
  const so = day.soul ?? {};
  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.soul }}>
      <Label>Study today's verse · Bhagavad Gita {v.chapter}.{v.verse}</Label>
      <Text style={{ fontSize: 19, lineHeight: 30, color: colors.ink }}>{v.sanskrit}</Text>
      <Text style={{ fontStyle: 'italic', color: colors.muted }}>{v.transliteration}</Text>
      <Note>1. Read it slowly, aloud if you can. 2. Open its meaning. 3. Write one line on what it says to you today.</Note>
      <ExplainVerse verse={v} />
      <TextField key={date + 'verse'} label="What it means to me today" value={so.verseNote ?? ''} multiline
        onChangeText={t => update(d => { d.soul = { ...d.soul, verseNote: t }; })} placeholder="One line is enough" />
      <Check checked={!!so.verseStudied} onToggle={() => update(d => { d.soul = { ...d.soul, verseStudied: !d.soul?.verseStudied }; })}
        title="I studied today's verse" points={15} />
    </Card>
  );
}

export function ThoughtCard() {
  const { day, date, update } = useHeal();
  const thought = (day.soul ?? {}).thought ?? '';
  return (
    <Card>
      <Label>Thought of the day</Label>
      <Text style={{ fontSize: 17, lineHeight: 26, color: colors.ink, fontWeight: '600' }}>{thoughtOfDay(date)}</Text>
      <TextField key={date + 'thought'} label="My thought to carry today" value={thought} multiline
        onChangeText={t => update(d => { d.soul = { ...d.soul, thought: t }; })} placeholder="In your own words, or something it brings to mind" />
      <Note>{thought.trim().length >= 3 ? '+10 for your thought today.' : 'Writing a thought adds 10 to Soul.'}</Note>
    </Card>
  );
}

export function GratitudeCard() {
  const { day, date, update } = useHeal();
  const list = (day.soul ?? {}).gratitude ?? [];
  const set = (i: number, t: string) => update(d => {
    const g = [...(d.soul?.gratitude ?? [])];
    g[i] = t;
    d.soul = { ...d.soul, gratitude: g };
  });
  const filled = list.filter(x => x?.trim()).length;
  return (
    <Card>
      <Heading>Gratitude</Heading>
      <Note>Three things you are grateful for today, big or small.</Note>
      {[0, 1, 2].map(i => (
        <TextField key={date + 'g' + i} label={`${i + 1}.`} value={list[i] ?? ''} onChangeText={t => set(i, t)}
          placeholder={['Someone who helped me', 'Something my body did for me', 'A small joy today'][i]} />
      ))}
      <Note>{filled ? `+${Math.min(3, filled) * 5} so far (5 each).` : '5 points each, up to 15.'}</Note>
    </Card>
  );
}

/** One question for the eight practices: did anything today go against them? */
export function PracticesCheck() {
  const { day, update } = useHeal();
  const checked = !!day.soul?.checked;
  const keptAll = () => update(d => {
    d.dharma = Object.fromEntries(PRACTICES.map(p => [p.id, true]));
    d.soul = { ...d.soul, checked: true };
  });
  const toggleSlip = (id: (typeof PRACTICES)[number]['id']) => update(d => {
    if (!d.soul?.checked) d.dharma = Object.fromEntries(PRACTICES.map(p => [p.id, true]));
    d.dharma[id] = !d.dharma[id];
    d.soul = { ...d.soul, checked: true };
  });
  const slips = PRACTICES.filter(p => checked && !day.dharma[p.id]);

  return (
    <Card>
      <Heading>The eight practices</Heading>
      <Text style={{ color: colors.ink, lineHeight: 22 }}>Was there any moment today when you went against one of these? Tap only the ones where you slipped.</Text>
      <View style={{ gap: 6 }}>
        {PRACTICES.map(p => {
          const slipped = checked && !day.dharma[p.id];
          return (
            <Pressable key={p.id} onPress={() => toggleSlip(p.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, borderWidth: 1,
                borderColor: slipped ? colors.bad : colors.line, backgroundColor: slipped ? colors.bad + '14' : colors.surface }}>
              <Text style={{ width: 20, color: slipped ? colors.bad : colors.good, fontWeight: '700' }}>{!checked ? '·' : slipped ? '✕' : '✓'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: colors.ink }}>{p.name}</Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>{p.meaning}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {!checked
        ? <Button title="No, I kept all eight today" onPress={keptAll} />
        : <Note>{slips.length ? `Noted: ${slips.map(p => p.name).join(', ')}. Be gentle with yourself; tomorrow is a new day. Tap again to undo.` : 'All eight kept today. Well done.'}</Note>}
    </Card>
  );
}
