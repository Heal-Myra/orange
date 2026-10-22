// Guided meditation inside the app: the app suggests a length, guides the breath, and records the minutes actually sat.

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Heading, Meter, Note, Score } from './ui';
import { tr } from '../lib/i18n';

const CHOICES = [5, 10, 20];
// A calm breathing rhythm: breathe in 4 s, breathe out 6 s (a longer out-breath settles the body).
const breath = (sec: number) => (sec % 10 < 4 ? tr('Breathe in…') : tr('Breathe out, slowly…'));

export function MeditationTimer() {
  const { day, profile, update } = useHeal();
  const target = profile.meditation;
  const done = day.mind.meditationMin ?? 0;
  const suggested = Math.max(5, Math.min(20, target - done || 5));
  const [length, setLength] = useState(CHOICES.includes(suggested) ? suggested : 10);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0); // time already sat before a pause
  const [now, setNow] = useState(Date.now());
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const running = startedAt != null;
  const elapsedMs = pausedMs + (running ? now - startedAt : 0);
  const left = Math.max(0, length * 60_000 - elapsedMs);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => setNow(Date.now()), 500);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [running]);

  const finish = (ms: number) => {
    const minutes = Math.round(ms / 60_000);
    if (minutes > 0) update(d => { d.mind.meditationMin = (d.mind.meditationMin ?? 0) + minutes; });
    setStartedAt(null); setPausedMs(0);
  };

  useEffect(() => { if (running && left === 0) finish(length * 60_000); }, [left, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => { setNow(Date.now()); setStartedAt(Date.now()); };
  const pause = () => { setPausedMs(elapsedMs); setStartedAt(null); };
  const mm = Math.floor(left / 60_000), ss = Math.floor((left % 60_000) / 1000);
  const sitting = running || pausedMs > 0;

  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.soul }}>
      <Heading right={<Score value={Math.min(30, (30 * done) / target)} max={30} />}>{tr('Breathing & meditation')}</Heading>
      {!sitting ? (
        <>
          <Note>{done >= target ? tr('You have sat {done} minutes today. Lovely. Another short sit is always welcome.', { done }) : tr('Suggested now: {suggested} minutes (today {done} of {target}).', { suggested, done, target })}</Note>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CHOICES.map(m => (
              <Pressable key={m} onPress={() => setLength(m)}
                style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, borderColor: m === length ? colors.soul : colors.line, backgroundColor: m === length ? colors.soul + '18' : colors.surface }}>
                <Text style={{ color: colors.ink, fontWeight: m === length ? '700' : '400' }}>{m} {tr('min')}</Text>
              </Pressable>
            ))}
          </View>
          <Note>{tr('Sit comfortably, let your eyes close, and follow the breath. The app counts only the minutes you actually sit.')}</Note>
          <Button title={tr('Begin {n}-minute meditation', { n: length })} onPress={start} />
          <Button kind="plain" title={tr('Guided Yoga Nidra, lying down (15 min)')} onPress={() => router.push('/yoga-nidra')} />
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
          <Text style={{ fontSize: 44, color: colors.ink, fontVariant: ['tabular-nums'] }}>{mm}:{String(ss).padStart(2, '0')}</Text>
          <Text style={{ fontSize: 18, color: colors.soul, fontWeight: '600' }}>{running ? breath(Math.floor(elapsedMs / 1000)) : tr('Paused')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {running ? <Button kind="plain" title={tr('Pause')} onPress={pause} /> : <Button title={tr('Continue')} onPress={start} />}
            <Button kind="plain" title={tr('End and save')} onPress={() => finish(elapsedMs)} />
          </View>
          <Note>{tr('Keep this screen open while you sit.')}</Note>
        </View>
      )}
      <Meter label={tr('Today')} value={done} max={target} color={colors.soul} right={`${done} / ${target} ${tr('min')}`} />
    </Card>
  );
}
