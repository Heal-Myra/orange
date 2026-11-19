// The monthly fitness test, one test at a time (founder, 16 Nov 2026 idea 5): how to do it, a stopwatch or a 30-second
// timer where needed, then the number. Saved with About you (me.fitness). Stop if anything hurts.

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, Card, Note, Screen } from '../components/ui';
import { todayISO } from '../lib/dates';
import { TESTS, bestBefore, fmtResult, type FitnessResult, type TestId } from '../lib/fitnessTest';
import { useHeal } from '../lib/store';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

export default function FitnessTest() {
  const { profile, setProfile } = useHeal();
  const today = todayISO();
  const [i, setI] = useState(0);
  const [res, setRes] = useState<FitnessResult>({ date: today });
  const [text, setText] = useState('');
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const t = TESTS[i];
  useEffect(() => () => { if (tick.current) clearInterval(tick.current); }, []);
  useEffect(() => { setText(''); setSecs(t?.timer === 30 ? 30 : 0); setRunning(false); if (tick.current) clearInterval(tick.current); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const startStop = () => {
    if (running) { if (tick.current) clearInterval(tick.current); setRunning(false); if (t.timer === 'stopwatch') setText(String(secs)); return; }
    setRunning(true);
    tick.current = setInterval(() => setSecs(s => {
      if (t.timer === 30) { if (s <= 1) { if (tick.current) clearInterval(tick.current); setRunning(false); return 0; } return s - 1; }
      return s + 1;
    }), 1000);
  };
  const value = (() => { const v = parseFloat(text.replace(',', '.')); return Number.isFinite(v) ? Math.round(v) : undefined; })();
  const next = (skip = false) => {
    const r = { ...res, ...(skip || value == null ? {} : { [t.id]: value }) };
    setRes(r);
    if (i < TESTS.length - 1) { setI(i + 1); return; }
    if (profile.me && TESTS.some(x => r[x.id] != null)) {
      const others = (profile.me.fitness ?? []).filter(x => x.date !== today);
      setProfile({ ...profile, me: { ...profile.me, fitness: [...others, r].sort((a, b) => a.date.localeCompare(b.date)) } });
    }
    router.back();
  };
  if (!t) return null;
  const best = bestBefore(profile.me?.fitness, t.id as TestId, today);
  const clockText = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  return (
    <Screen noBanner>
      <Text style={{ color: colors.muted, fontSize: 13 }}>{tr('Test {n} of {m}', { n: i + 1, m: TESTS.length })}</Text>
      <Card style={{ gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>{tr(t.name)}</Text>
        <Text style={{ fontSize: 15, color: colors.ink, lineHeight: 21 }}>{tr(t.how)}</Text>
        {best != null ? <Text style={{ color: colors.insight, fontWeight: '600' }}>✦ {tr('Your best: {v}. Beat it by one.', { v: fmtResult(t.id, best) })}</Text> : null}
        {t.timer ? (
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: 48, fontWeight: '800', color: colors.ink }}>{clockText}</Text>
            <Pressable onPress={startStop} accessibilityRole="button" style={{ borderRadius: 99, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: running ? colors.insight : colors.accent }}>
              <Text style={{ color: colors.onAccent, fontWeight: '700', fontSize: 16 }}>{running ? tr('Stop') : tr('Start')}</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ flex: 1, color: colors.ink, fontSize: 15 }}>{t.unit === 'secs' ? tr('Seconds held') : t.unit === 'cm' ? tr('Centimetres') : tr('How many')}</Text>
          <TextInput value={text} onChangeText={setText} keyboardType="numbers-and-punctuation" placeholder="–" placeholderTextColor={colors.muted}
            style={{ width: 90, textAlign: 'right', borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 17, color: colors.ink }} />
        </View>
        <Button title={i < TESTS.length - 1 ? tr('Next') : tr('Save')} onPress={() => next()} disabled={value == null} />
        <Button kind="plain" title={tr('Skip this one')} onPress={() => next(true)} />
      </Card>
      <Note>{tr('Stop if anything hurts. Same way each month, so the numbers compare.')}</Note>
    </Screen>
  );
}
