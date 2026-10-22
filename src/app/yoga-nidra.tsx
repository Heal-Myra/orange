// Guided Yoga Nidra (founder, 22 Oct 2026). Myra's voice reads our own script (src/lib/yogaNidra.ts) step by step,
// with silences in between; the screen stays dark and awake; the minutes count toward Breathing & meditation.
// At bedtime the session ends by letting the person fall asleep. The voice needs the iPhone build with expo-speech;
// older builds show the words on screen at the same pace.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lang, tr } from '../lib/i18n';
import { partOfDay } from '../lib/context';
import { momentOf } from '../lib/routine';
import { useHeal } from '../lib/store';
import { nidraMinutes, nidraScript, type Stage } from '../lib/yogaNidra';

// Native helpers arrived with build 9; older builds simply read along without a voice.
let Speech: typeof import('expo-speech') | null = null;
try { Speech = require('expo-speech'); } catch { Speech = null; }
let Awake: typeof import('expo-keep-awake') | null = null;
try { Awake = require('expo-keep-awake'); } catch { Awake = null; }

const NIGHT = { bg: '#0F1E22', card: '#172C31', ink: '#E8EEEE', muted: '#93A6A8', glow: '#E0794F' };
const STAGE: Record<Stage, string> = { settle: 'Settling', resolve: 'Sankalpa', body: 'Body', breath: 'Breath', feel: 'Feelings', images: 'Images', end: 'Rest' };

export default function YogaNidra() {
  const { profile, update } = useHeal();
  const params = useLocalSearchParams<{ bed?: string }>();
  const bedtime = params.bed ? params.bed === '1' : momentOf(profile.me?.routine)?.now.kind === 'sleep' || partOfDay() === 'night';
  const steps = useMemo(() => nidraScript(bedtime), [bedtime]);
  const total = nidraMinutes(steps);
  const hi = lang() === 'hi';

  const [i, setI] = useState(-1);         // -1 = not started; steps.length = finished
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sat = useRef(0);                  // ms already counted
  const since = useRef<number | null>(null);
  const saved = useRef(false);

  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const elapsed = () => sat.current + (since.current ? Date.now() - since.current : 0);

  const save = useCallback(() => {
    if (saved.current) return;
    const minutes = Math.round(elapsed() / 60_000);
    if (minutes > 0) { saved.current = true; update(d => { d.mind.meditationMin = (d.mind.meditationMin ?? 0) + minutes; }); }
  }, [update]);

  // Speak the current step, then wait its silence, then move on.
  useEffect(() => {
    if (!playing || i < 0) return;
    if (i >= steps.length) { setPlaying(false); return; }
    const step = steps[i];
    const text = hi ? step.hi : step.en;
    const next = () => { timer.current = setTimeout(() => setI(n => n + 1), step.pause * 1000); };
    if (Speech) {
      Speech.speak(text, { language: hi ? 'hi-IN' : 'en-IN', rate: 0.85, pitch: 0.95, useApplicationAudioSession: false, onDone: next, onError: () => next() });
    } else {
      timer.current = setTimeout(next, (text.split(/\s+/).length / 2.3) * 1000);
    }
    return () => { clear(); Speech?.stop(); };
  }, [i, playing, steps, hi]);

  // Count the time, keep the screen awake while playing, and save the minutes at the end.
  useEffect(() => {
    if (playing) { since.current = Date.now(); Awake?.activateKeepAwakeAsync('nidra').catch(() => {}); }
    else if (since.current) { sat.current += Date.now() - since.current; since.current = null; Awake?.deactivateKeepAwake('nidra').catch?.(() => {}); }
  }, [playing]);
  useEffect(() => { if (i >= steps.length) save(); }, [i, steps.length, save]);
  useEffect(() => () => { clear(); Speech?.stop(); try { Awake?.deactivateKeepAwake('nidra'); } catch { /* fine */ } }, []);

  const begin = () => { saved.current = false; sat.current = 0; setI(0); setPlaying(true); };
  const close = () => { setPlaying(false); Speech?.stop(); if (i >= 0) { if (since.current) { sat.current += Date.now() - since.current; since.current = null; } save(); } router.canGoBack() ? router.back() : router.replace('/'); };

  const step = i >= 0 && i < steps.length ? steps[i] : null;
  const done = i >= steps.length;
  const progress = i < 0 ? 0 : Math.min(1, i / steps.length);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NIGHT.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16 }}>
        <Pressable onPress={close} accessibilityLabel={tr('Close')} hitSlop={12}><Ionicons name="close" size={28} color={NIGHT.muted} /></Pressable>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 22 }}>
        {i < 0 ? (
          <>
            <Text style={{ color: NIGHT.glow, fontSize: 15, fontWeight: '700', letterSpacing: 1 }}>{tr('YOGA NIDRA')}</Text>
            <Text style={{ color: NIGHT.ink, fontSize: 30, fontWeight: '600', lineHeight: 38 }}>{bedtime ? tr('Rest deeply, and drift into sleep.') : tr('Deep rest, lying down.')}</Text>
            <Text style={{ color: NIGHT.muted, fontSize: 16, lineHeight: 24 }}>
              {tr('About {n} minutes. Lie on your back, eyes closed, and follow Myra\'s voice. Keep the body still; the mind stays gently awake.', { n: total })}
            </Text>
            <Text style={{ color: NIGHT.muted, fontSize: 14, lineHeight: 21 }}>
              {Speech ? tr('Turn the sound up. If the phone is on silent, switch silent off so you can hear the voice.') : tr('Voice guidance comes with the next app version. For now the words appear here at a calm pace.')}
            </Text>
            <Pressable onPress={begin} accessibilityRole="button"
              style={({ pressed }) => ({ backgroundColor: NIGHT.glow, borderRadius: 99, paddingVertical: 16, alignItems: 'center', opacity: pressed ? 0.8 : 1, marginTop: 8 })}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{tr('Begin Yoga Nidra')}</Text>
            </Pressable>
          </>
        ) : done ? (
          <>
            <Text style={{ color: NIGHT.ink, fontSize: 26, fontWeight: '600', lineHeight: 34 }}>{bedtime ? tr('Sleep well.') : tr('Yoga Nidra is complete.')}</Text>
            <Text style={{ color: NIGHT.muted, fontSize: 16 }}>{tr('Your minutes are added to Breathing & meditation.')}</Text>
          </>
        ) : (
          <>
            <Text style={{ color: NIGHT.glow, fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>{tr(STAGE[step!.stage]).toUpperCase()}</Text>
            <Text style={{ color: NIGHT.ink, fontSize: 22, lineHeight: 32, opacity: 0.9 }}>{hi ? step!.hi : step!.en}</Text>
          </>
        )}
      </View>
      {i >= 0 && !done ? (
        <View style={{ padding: 28, gap: 18 }}>
          <View style={{ height: 3, backgroundColor: NIGHT.card, borderRadius: 2 }}>
            <View style={{ height: 3, width: `${progress * 100}%`, backgroundColor: NIGHT.glow, borderRadius: 2 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 40 }}>
            <Pressable onPress={() => setPlaying(p => !p)} accessibilityLabel={playing ? tr('Pause') : tr('Continue')} hitSlop={12}
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: NIGHT.card, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={playing ? 'pause' : 'play'} size={28} color={NIGHT.ink} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
