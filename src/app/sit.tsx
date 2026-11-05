// A Dhamma path sitting (decision 0049): mostly silence. Myra gives the day's instruction, a gentle reminder every few
// minutes and a soft ending; the screen shows only the time left. Afterwards: "How did it feel?" Calm, Restless or
// Uneasy, which decides tomorrow's step. Minutes count toward Meditation.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FullScreen } from '../components/FullScreen';
import { minutesFor, pathState, stageOf, STEPS, type Feel } from '../lib/dhamma';
import { ALL_LINES, CARD_LINE, feelLine, sittingCues, STAGE_NAME } from '../lib/dhammaScript';
import { todayISO } from '../lib/dates';
import { useGuideText } from '../lib/guideText';
import { lang, tr } from '../lib/i18n';
import { optional } from '../lib/native';
import { useServerVoice } from '../lib/serverVoice';
import { useHeal } from '../lib/store';
import { speak, voiceLang } from '../lib/voice';

const Awake = optional(['ExpoKeepAwake'], () => require('expo-keep-awake') as typeof import('expo-keep-awake'));
// Dusk blue with soft light text: calm, low glare with the eyes nearly closed.
const C = { bg: '#1E2A3A', ink: '#EEF1F6', muted: '#A7B3C4', glow: '#E0A47F', ring: '#33435A' };

export default function Sit() {
  const { lang: gl } = useLocalSearchParams<{ lang?: string }>();
  const gLang: string = gl || lang();
  const { days, update } = useHeal();
  const today = todayISO();
  const p = useMemo(() => pathState(days, today), []); // eslint-disable-line react-hooks/exhaustive-deps
  const step = p.next;
  const minutes = minutesFor(step, p.gentle, p.soft);
  const cues = useMemo(() => sittingCues(step, minutes, p.soft), [step, minutes, p.soft]);
  const { say, loading } = useGuideText(gLang, ALL_LINES);
  const lines = useMemo(() => (loading ? [] : cues.map(c => say(c.line))), [cues, loading]); // eslint-disable-line react-hooks/exhaustive-deps
  const { preparing } = useServerVoice(gLang, lines, !loading);

  const [phase, setPhase] = useState<'ready' | 'sitting' | 'feel' | 'done'>('ready');
  // Time sat, from the clock (not by counting ticks), so it is exact even if the phone was busy (5 Nov 2026).
  const [sat, setSat] = useState(0); // seconds sat
  const [paused, setPaused] = useState(false);
  const since = useRef<number | null>(null), before = useRef(0);
  const [satFinal, setSatFinal] = useState(0);
  const [feel, setFeel] = useState<Feel | null>(null);
  const spoken = useRef(new Set<number>());
  const stop = useRef<() => void>(() => {});
  const total = minutes * 60;
  const stage = step > STEPS ? 'body' : stageOf(step);

  useEffect(() => {
    if (phase !== 'sitting' || paused) return;
    since.current = Date.now();
    const t = setInterval(() => setSat(Math.floor((before.current + Date.now() - since.current!) / 1000)), 500);
    return () => { clearInterval(t); if (since.current) { before.current += Date.now() - since.current; since.current = null; } };
  }, [phase, paused]);

  useEffect(() => {
    if (phase !== 'sitting') return;
    cues.forEach((c, k) => {
      if (sat >= c.at && !spoken.current.has(k)) { spoken.current.add(k); stop.current(); stop.current = speak(say(c.line), voiceLang(gLang), () => {}); }
    });
    if (sat >= total) finish(total + 1);
  }, [sat, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'sitting') Awake?.activateKeepAwakeAsync('sit').catch(() => {});
    else try { Awake?.deactivateKeepAwake('sit'); } catch { /* fine */ }
  }, [phase]);
  useEffect(() => () => { stop.current(); try { Awake?.deactivateKeepAwake('sit'); } catch { /* fine */ } }, []);

  /** Save the minutes; the step counts when at least half the time was sat. */
  const finish = (upTo: number) => {
    stop.current();
    const secs = Math.min(total, upTo, Math.floor((before.current + (since.current ? Date.now() - since.current : 0)) / 1000));
    setSatFinal(secs);
    const m = Math.floor(secs / 60); // whole minutes actually sat
    const counts = secs >= total / 2;
    if (m > 0 || counts) update(d => {
      d.mind.meditationMin = (d.mind.meditationMin ?? 0) + m;
      if (counts) d.mind.dhamma = { ...d.mind.dhamma, sits: [...(d.mind.dhamma?.sits ?? []), { step, min: m, sec: secs, at: new Date().toISOString() }] };
    });
    setPhase(counts ? 'feel' : 'done');
  };

  const answer = (f: Feel) => {
    setFeel(f);
    update(d => {
      const sits = [...(d.mind.dhamma?.sits ?? [])];
      if (sits.length) sits[sits.length - 1] = { ...sits[sits.length - 1], feel: f };
      d.mind.dhamma = { ...d.mind.dhamma, sits };
    });
  };

  const close = () => {
    if (phase === 'sitting') { finish(Infinity); return; }
    router.canGoBack() ? router.back() : router.replace('/');
  };
  const left = Math.max(0, total - sat);
  const title = step > STEPS ? tr('Daily sitting') : tr('Day {n} of 10', { n: step });

  return (
    <FullScreen style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <Text style={{ color: C.glow, fontWeight: '700', letterSpacing: 1 }}>{tr('DHAMMA PATH')} · {title.toUpperCase()}</Text>
        <Pressable onPress={close} hitSlop={12} accessibilityLabel={tr('Close')}><Ionicons name="close" size={26} color={C.muted} /></Pressable>
      </View>

      {phase === 'ready' ? (
        <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 14 }}>
          <Text style={{ color: C.muted, fontSize: 13, fontWeight: '700', letterSpacing: 1 }}>{tr(STAGE_NAME[stage]).toUpperCase()}</Text>
          <Text style={{ color: C.ink, fontSize: 26, fontWeight: '600', lineHeight: 34 }}>{tr(CARD_LINE[stage])}</Text>
          <Text style={{ color: C.muted, fontSize: 16 }}>{tr('{n} minutes', { n: minutes })} · {tr('guided')}{p.soft ? ` · ${tr('eyes open')}` : ''}</Text>
          <Text style={{ color: C.muted, fontSize: 14, lineHeight: 20 }}>{tr('Myra speaks a few words, then mostly silence. Turn the sound up.')}</Text>
          {loading ? <Text style={{ color: C.muted, fontSize: 14 }}>{tr('Myra is preparing the session in your language…')}</Text>
            : preparing ? <Text style={{ color: C.muted, fontSize: 14 }}>{tr('Preparing Myra\'s voice…')}</Text> : null}
          <Pressable disabled={loading || preparing} onPress={() => setPhase('sitting')} accessibilityRole="button"
            style={({ pressed }) => ({ backgroundColor: C.glow, borderRadius: 99, paddingVertical: 16, alignItems: 'center', opacity: pressed || loading || preparing ? 0.7 : 1, marginTop: 8 })}>
            <Text style={{ color: '#1E2A3A', fontSize: 18, fontWeight: '700' }}>{tr('Begin')}</Text>
          </Pressable>
        </View>
      ) : phase === 'sitting' ? (
        <>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Text style={{ color: C.ink, fontSize: 56, fontWeight: '300', fontVariant: ['tabular-nums'] }}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</Text>
            <Text style={{ color: C.muted, fontSize: 16 }}>{paused ? tr('Paused') : tr(STAGE_NAME[stage])}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 36, paddingBottom: 28 }}>
            <Pressable onPress={() => { setPaused(x => !x); stop.current(); }} hitSlop={10} accessibilityLabel={paused ? tr('Continue') : tr('Pause')}
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.ring, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={paused ? 'play' : 'pause'} size={28} color={C.ink} />
            </Pressable>
            <Pressable onPress={() => finish(Infinity)} hitSlop={10} accessibilityLabel={tr('End and save')} style={{ justifyContent: 'center' }}>
              <Ionicons name="stop-circle-outline" size={30} color={C.muted} />
            </Pressable>
          </View>
        </>
      ) : phase === 'feel' ? (
        <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 16 }}>
          <Text style={{ color: C.ink, fontSize: 26, fontWeight: '600' }}>{step > STEPS ? tr('Sitting done') : tr('Day {n} done', { n: step })}</Text>
          <Text style={{ color: C.muted, fontSize: 15 }}>{tr('You sat {m} min {s} s of {t} min.', { m: Math.floor(satFinal / 60), s: satFinal % 60, t: minutes })}</Text>
          <Text style={{ color: C.muted, fontSize: 17 }}>{tr('How did it feel?')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([['calm', '😌', 'Calm'], ['restless', '🌀', 'Restless'], ['uneasy', '😟', 'Uneasy']] as const).map(([id, icon, name]) => (
              <Pressable key={id} onPress={() => answer(id)} accessibilityRole="button" accessibilityState={{ selected: feel === id }}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: feel === id ? C.glow : C.ring }}>
                <Text style={{ color: feel === id ? '#1E2A3A' : C.ink, fontSize: 16, fontWeight: '600' }}>{icon} {tr(name)}</Text>
              </Pressable>
            ))}
          </View>
          {feel ? <Text style={{ color: C.ink, fontSize: 16, lineHeight: 23 }}>{feelLine(feel, step)}</Text> : null}
          {feel ? (
            <Pressable onPress={close} accessibilityRole="button" style={{ backgroundColor: C.glow, borderRadius: 99, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#1E2A3A', fontSize: 17, fontWeight: '700' }}>{tr('Done')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 14 }}>
          <Text style={{ color: C.ink, fontSize: 24, fontWeight: '600' }}>{step > STEPS ? tr('Your minutes are saved.') : tr('Day {n} again next time', { n: step })}</Text>
          <Text style={{ color: C.muted, fontSize: 16, lineHeight: 23 }}>{tr('You sat {m} min {s} s of {t} min.', { m: Math.floor(satFinal / 60), s: satFinal % 60, t: minutes })} {tr('A day counts when you sit at least half the time ({h} min). Your minutes still count.', { h: Math.ceil(minutes / 2) })}</Text>
          <Pressable onPress={close} accessibilityRole="button" style={{ backgroundColor: C.glow, borderRadius: 99, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: '#1E2A3A', fontSize: 17, fontWeight: '700' }}>{tr('Done')}</Text>
          </Pressable>
        </View>
      )}
    </FullScreen>
  );
}

