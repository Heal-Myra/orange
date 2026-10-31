// Soul tab cards: Gita verse to study, thought of the day, gratitude, and one simple check for the eight practices.
// Points (docs/scoring.md): gratitude 7.5 each up to four (30), Daily Wisdom 20 (founder, 25 Oct 2026).

import { Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { verseOfDay } from '../lib/gita';
import { passageOfDay, sourceOf, traditionName } from '../lib/wisdom';
import { LEARN_SHARE, POINTS, PRACTICES, lived, wisdomStudied } from '../lib/scoring';
import { EntryHead, PASTEL, RingTop, pts } from './Rings';
import { MyraLine } from './MyraLine';
import { useHeal } from '../lib/store';
import { thoughtOfDay } from '../lib/thoughts';
import { colors } from '../theme';
import { ExplainPassage, ExplainVerse } from './AiBits';
import { Button, Card, Check, Heading, Label, Note, Score, TextField, s, useKeepVisible } from './ui';
import { tr } from '../lib/i18n';

/** Daily Wisdom: the passage of the day from the person's chosen tradition (Gita when Hindu or not chosen). */
export function VerseStudyCard() {
  const { day, date, update } = useHeal();
  const { tradition } = useAuth();
  const t = tradition ?? 'hindu';
  const p = passageOfDay(t, date);
  const v = verseOfDay(date);
  const so = day.soul ?? {};
  // Rings on top (studied, lived), the writing below with each ring's dot; Myra's line at the bottom (decision 0037).
  const W = POINTS.wisdom, studyPts = wisdomStudied(so) ? LEARN_SHARE * W : 0, livedPts = lived(so.verseLived) ? (1 - LEARN_SHARE) * W : 0;
  return (
    <Card>
      <Heading right={<Score value={studyPts + livedPts} max={W} />}>{tr('Daily Wisdom')}</Heading>
      <RingTop score={studyPts + livedPts} max={W} items={[
        { id: 'study', color: PASTEL.sand, label: tr('What it means to me'), value: studyPts ? 1 : 0 },
        { id: 'lived', color: PASTEL.peach, label: tr('Lived'), value: livedPts ? 1 : 0 },
      ]} />
      {p ? (
        <>
          <Label>{p.ref} · {t === 'jain' ? tr('Universal wisdom (Jain texts coming soon)') : tr(traditionName(t))}</Label>
          {p.original ? <Text style={p.lang === 'ar'
            ? { fontFamily: 'AmiriQuran_400Regular', fontSize: 24, lineHeight: 48, color: colors.ink, textAlign: 'right', writingDirection: 'rtl' }
            : { fontSize: 19, lineHeight: 32, color: colors.ink }}>{p.original}</Text> : null}
          {p.translit ? <Text style={{ fontStyle: 'italic', color: colors.muted }}>{p.translit}</Text> : null}
          {p.english ? <Text style={{ fontSize: 16, lineHeight: 24, color: colors.ink }}>{p.english}</Text> : null}
          <Note>{tr('1. Read it slowly, aloud if you can. 2. Open its meaning. 3. Write one line on what it says to you today.')}</Note>
          <ExplainPassage passage={p} tradition={t} />
          <Text style={{ fontSize: 11, color: colors.muted }}>Source: {sourceOf(t)}</Text>
        </>
      ) : (
        <>
          <Label>{tr('Bhagavad Gita')} {v.chapter}.{v.verse} · {tr('verse of the day')}</Label>
          <Text style={{ fontSize: 19, lineHeight: 30, color: colors.ink }}>{v.sanskrit}</Text>
          <Text style={{ fontStyle: 'italic', color: colors.muted }}>{v.transliteration}</Text>
          <Note>{tr('1. Read it slowly, aloud if you can. 2. Open its meaning. 3. Write one line on what it says to you today.')}</Note>
          <ExplainVerse verse={v} />
        </>
      )}
      {/* One line on what it means counts as studied (founder, 31 Oct 2026: the tick box was removed). */}
      <EntryHead color={PASTEL.sand} title={tr('What it means to me today')} points={pts(studyPts, LEARN_SHARE * W)} />
      <TextField key={date + 'verse'} label="" value={so.verseNote ?? ''} multiline
        onChangeText={t => update(d => { d.soul = { ...d.soul, verseNote: t }; })} placeholder={tr('One line is enough')} />
      {/* Living it earns the other 75 % (founder, 26 Oct 2026). Usually written later in the day. */}
      <EntryHead color={PASTEL.peach} title={tr('How I lived it today')} points={pts(livedPts, (1 - LEARN_SHARE) * W)} />
      <TextField key={date + 'lived'} label="" value={so.verseLived ?? ''} multiline
        onChangeText={t => update(d => { d.soul = { ...d.soul, verseLived: t }; })} placeholder={tr('e.g. I paused and took three breaths before replying in anger.')} />
      <MyraLine card="wisdom" />
    </Card>
  );
}

export function ThoughtCard() {
  const { day, date, update } = useHeal();
  const thought = (day.soul ?? {}).thought ?? '';
  return (
    <Card>
      <Label>{tr('Thought of the day')}</Label>
      <Text style={{ fontSize: 17, lineHeight: 26, color: colors.ink, fontWeight: '600' }}>{tr(thoughtOfDay(date))}</Text>
      <TextField key={date + 'thought'} label={tr('My thought to carry today')} value={thought} multiline
        onChangeText={t => update(d => { d.soul = { ...d.soul, thought: t }; })} placeholder={tr('In your own words, or something it brings to mind')} />
      <Note>{thought.trim().length >= 3 ? tr('+15 for your thought today.') : tr('Writing a thought adds 15 to Soul.')}</Note>
    </Card>
  );
}

const QUESTIONS = ['Someone who helped me', 'Something my body did for me', 'A small joy today', 'Something I learned'];

export function GratitudeCard() {
  const { day, date, update } = useHeal();
  const keep = useKeepVisible();
  const list = (day.soul ?? {}).gratitude ?? [];
  const set = (i: number, t: string) => update(d => {
    // Never leave holes: writing box 3 first used to save boxes 1–2 as null and crashed the score (23 Oct 2026).
    const g = Array.from({ length: Math.max(4, d.soul?.gratitude?.length ?? 0) }, (_, k) => d.soul?.gratitude?.[k] ?? '');
    g[i] = t;
    d.soul = { ...d.soul, gratitude: g };
  });
  const filled = list.filter(x => x?.trim()).length;
  return (
    <Card>
      <Heading>{tr('Gratitude')}</Heading>
      <Note>{tr('Four things you are grateful for today, big or small.')}</Note>
      {/* Founder's choice (21 Oct 2026, option B): the question on the left stays visible next to its answer. */}
      {QUESTIONS.map((q, i) => (
        <View key={date + 'g' + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
          <View style={{ width: 128 }}>
            <Text style={{ color: colors.soul, fontWeight: '700', fontSize: 12 }}>{i + 1}</Text>
            <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 14, lineHeight: 18 }}>{tr(q)}</Text>
          </View>
          <TextInput style={[s.input, { flex: 1, minWidth: 0, minHeight: 46, paddingVertical: 11 }]} value={list[i] ?? ''} onChangeText={t => set(i, t)} multiline numberOfLines={1}
            placeholder={tr('Write here')} placeholderTextColor={colors.muted}
            onFocus={() => setTimeout(keep, 300)} onContentSizeChange={() => keep()} />
        </View>
      ))}
      <Note>{filled ? tr('{n} of 4 written.', { n: Math.min(4, filled) }) : tr('Up to four things, 30 points.')}</Note>
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
      <Heading>{tr('The eight practices')}</Heading>
      <Text style={{ color: colors.ink, lineHeight: 22 }}>{tr('Was there any moment today when you went against one of these? Tap only the ones where you slipped.')}</Text>
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
                <Text style={{ fontSize: 13, color: colors.muted }}>{tr(p.meaning)}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {!checked
        ? <Button title={tr('No, I kept all eight today')} onPress={keptAll} />
        : <Note>{slips.length ? tr('Noted: {list}. Be gentle with yourself; tomorrow is a new day. Tap again to undo.', { list: slips.map(p => p.name).join(', ') }) : tr('All eight kept today. Well done.')}</Note>}
    </Card>
  );
}
