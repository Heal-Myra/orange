// Know your nature, prakriti (founder, 16 Nov 2026 idea 9): 12 short questions, one at a time, then the result and
// the Food master's everyday tip. A tradition to explore, not a diagnosis; take it again any time.

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Note, Screen } from '../components/ui';
import { todayISO } from '../lib/dates';
import { ABOUT, QUESTIONS, prakritiOf } from '../lib/prakriti';
import { useHeal } from '../lib/store';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

export default function PrakritiQuiz() {
  const { profile, setProfile } = useHeal();
  const saved = profile.me?.prakriti;
  const [answers, setAnswers] = useState<number[]>([]);
  // 'auto' until the person acts: the saved result when there is one (the profile loads a moment after the screen).
  const [mode, setMode] = useState<'auto' | 'quiz' | 'result'>('auto');
  const i = answers.length;
  const pick = (a: number) => {
    const next = [...answers, a];
    setAnswers(next);
    if (next.length === QUESTIONS.length && profile.me) {
      setProfile({ ...profile, me: { ...profile.me, prakriti: { answers: next, result: prakritiOf(next).result, date: todayISO() } } });
      setMode('result');
    }
  };
  if (mode === 'result' || (mode === 'auto' && saved)) {
    const p = i === QUESTIONS.length ? prakritiOf(answers) : prakritiOf(saved?.answers ?? answers);
    const first = ABOUT[p.main[0]];
    return (
      <Screen noBanner>
        <Card style={{ gap: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>{tr('YOUR RESULT')}</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink }}>{p.result}</Text>
          <Text style={{ fontSize: 15, color: colors.muted }}>{tr(first.words)}</Text>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 4 }}>
            {(['vata', 'pitta', 'kapha'] as const).map(d => <Text key={d} style={{ color: colors.ink }}>{d[0].toUpperCase() + d.slice(1)} <Text style={{ fontWeight: '700' }}>{p.counts[d]}</Text></Text>)}
          </View>
          <Text style={{ color: colors.insight, fontSize: 16, fontWeight: '600', marginTop: 6 }}>✦ {tr(first.tip)}</Text>
          <Note>{tr('A tradition to explore, not a diagnosis. The Food master now leans on it.')}</Note>
          <Button kind="plain" title={tr('Take it again')} onPress={() => { setAnswers([]); setMode('quiz'); }} />
          <Button title={tr('Done')} onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }
  const q = QUESTIONS[i];
  return (
    <Screen noBanner>
      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{tr('Question {n} of {m}', { n: i + 1, m: QUESTIONS.length })}</Text>
        <Text style={{ fontSize: 19, color: colors.ink, fontWeight: '600' }}>{tr(q.q)}</Text>
        {q.a.map((a, k) => (
          <Pressable key={k} onPress={() => pick(k)} accessibilityRole="button"
            style={({ pressed }) => ({ borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: pressed ? colors.tint : colors.surface })}>
            <Text style={{ fontSize: 15.5, color: colors.ink }}>{tr(a)}</Text>
          </Pressable>
        ))}
        {i > 0 ? <Pressable onPress={() => setAnswers(answers.slice(0, -1))} hitSlop={8}><Text style={{ color: colors.accent, fontWeight: '600' }}>‹ {tr('Back')}</Text></Pressable> : null}
      </Card>
      <Note>{tr('Answer for how you have mostly been through life, not just today.')}</Note>
    </Screen>
  );
}
