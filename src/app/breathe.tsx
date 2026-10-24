// Happy Orange guided pranayama player (founder, 24 Oct 2026): our own guided session. A breathing circle grows on the
// in-breath and settles on the out-breath, the nostril to use lights up for Anulom Vilom, quick breaths pulse for
// Bhastrika and Kapalbhati, and Myra's voice gives each cue. Minutes count toward Breathing & meditation.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lang, tr } from '../lib/i18n';
import { optional } from '../lib/native';
import { phasesFor, practice, segmentName, sessionPlan, type Phase, type PracticeId, type Segment } from '../lib/pranayama';
import { useHeal } from '../lib/store';
import { gentleToday } from '../lib/feeling';
import { todayISO } from '../lib/dates';
import { speak } from '../lib/voice';

const Awake = optional(['ExpoKeepAwake'], () => require('expo-keep-awake') as typeof import('expo-keep-awake'));
const C = { bg: '#10221F', ring: '#1C3934', ink: '#EAF2EF', muted: '#93AAA4', glow: '#E0794F', calm: '#6FB7A8' };
const QUICK = (ph: Phase) => ph.seconds < 2;

interface Step { seg: number; phase: Phase; intro?: string }

export default function Breathe() {
  const { practice: pid, minutes } = useLocalSearchParams<{ practice?: string; minutes?: string }>();
  const { update } = useHeal();
  const choice = (pid ?? 'mix') as PracticeId;
  const mins = Math.max(1, Math.min(60, Number(minutes) || 10));
  const { days } = useHeal();
  const gentle = gentleToday(days[todayISO()]?.feeling);
  const plan = useMemo<Segment[]>(() => sessionPlan(choice, mins, undefined, gentle), [choice, mins, gentle]);
  // Each part opens with a short spoken "how to", then its breaths.
  const steps = useMemo<Step[]>(() => plan.flatMap((seg, k): Step[] => {
    const how = seg.id === 'still' ? '' : practice(seg.id).how;
    const introSec = how ? Math.min(14, Math.max(6, Math.round(how.split(/\s+/).length / 2.2))) : 0;
    const head: Step[] = how ? [{ seg: k, intro: how, phase: { kind: 'rest', seconds: introSec, cue: how } }] : [];
    return [...head, ...phasesFor({ ...seg, seconds: Math.max(10, seg.seconds - introSec) }).map(ph => ({ seg: k, phase: ph }))];
  }), [plan]);
  const totalSec = useMemo(() => steps.reduce((t, s) => t + s.phase.seconds, 0), [steps]);

  const [i, setI] = useState(-1); // -1 = not started
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const size = useRef(new Animated.Value(0.6)).current;
  const sat = useRef(0), since = useRef<number | null>(null), saved = useRef(false);
  const voice = lang() === 'hi' ? 'hi-IN' : 'en-IN';
  const done = i >= steps.length;

  const save = () => {
    if (saved.current) return;
    if (since.current) { sat.current += Date.now() - since.current; since.current = null; }
    const m = Math.round(sat.current / 60000);
    if (m > 0) { saved.current = true; update(d => { d.mind.meditationMin = (d.mind.meditationMin ?? 0) + m; }); }
  };

  // Play each step: move the circle, speak the cue (not on every quick breath), then the next step.
  useEffect(() => {
    if (!playing || i < 0) return;
    if (i >= steps.length) { setPlaying(false); save(); return; }
    const { phase, intro } = steps[i];
    const prev = steps[i - 1]?.phase;
    const target = phase.kind === 'in' ? 1 : phase.kind === 'hold' ? null : phase.kind === 'rest' ? 0.72 : phase.kind === 'pump' ? 0.62 : 0.55;
    if (phase.kind === 'pump') {
      Animated.sequence([
        Animated.timing(size, { toValue: 0.5, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(size, { toValue: 0.68, duration: phase.seconds * 1000 - 250, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    } else if (target != null) {
      Animated.timing(size, { toValue: target, duration: phase.seconds * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }).start();
    }
    const firstOfRun = !prev || prev.kind !== phase.kind || prev.cue !== phase.cue;
    const say = intro ? tr(intro) : QUICK(phase) ? (firstOfRun && prev && QUICK(prev) ? null : firstOfRun ? tr('Begin') : null) : tr(phase.cue);
    let stop = () => {};
    if (voiceOn && say) stop = speak(say, voice, () => {});
    const t = setTimeout(() => setI(n => n + 1), phase.seconds * 1000);
    return () => { clearTimeout(t); if (!QUICK(phase)) stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, playing]);

  useEffect(() => {
    if (playing) { since.current = Date.now(); Awake?.activateKeepAwakeAsync('breathe').catch(() => {}); }
    else { if (since.current) { sat.current += Date.now() - since.current; since.current = null; } try { Awake?.deactivateKeepAwake('breathe'); } catch { /* fine */ } }
  }, [playing]);
  useEffect(() => () => { try { Awake?.deactivateKeepAwake('breathe'); } catch { /* fine */ } }, []);

  const close = () => { setPlaying(false); if (i >= 0) save(); router.canGoBack() ? router.back() : router.replace('/'); };
  const elapsed = i < 0 ? 0 : steps.slice(0, Math.min(i, steps.length)).reduce((t, s) => t + s.phase.seconds, 0);
  const left = Math.max(0, totalSec - elapsed);
  const step = i >= 0 && i < steps.length ? steps[i] : null;
  const seg = step ? plan[step.seg] : null;
  const pr = choice === 'mix' ? null : practice(choice);
  const D = 240;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <Text style={{ color: C.glow, fontWeight: '700', letterSpacing: 1 }}>{tr('HAPPY ORANGE · BREATHE')}</Text>
        <Pressable onPress={close} hitSlop={12} accessibilityLabel={tr('Close')}><Ionicons name="close" size={26} color={C.muted} /></Pressable>
      </View>

      {i < 0 ? (
        <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 16 }}>
          <Text style={{ color: C.ink, fontSize: 30, fontWeight: '600' }}>{pr ? tr(pr.name) : tr("Myra's mix")}</Text>
          <Text style={{ color: C.muted, fontSize: 16 }}>{tr('{n} minutes', { n: mins })} · {plan.filter(s => s.id !== 'still').map(s => tr(segmentName(s.id))).join(' → ')} → {tr('Stillness')}</Text>
          {pr?.caution ? <Text style={{ color: C.glow, fontSize: 14, lineHeight: 20 }}>{tr(pr.caution)}</Text> : null}
          {!pr && plan.some(s => s.id !== 'still' && practice(s.id).energising) ? <Text style={{ color: C.glow, fontSize: 14, lineHeight: 20 }}>{tr('Bhastrika and Kapalbhati are strong breaths: skip them if pregnant, or with high blood pressure, heart disease, hernia or recent surgery. Empty stomach. Stop if dizzy.')}</Text> : null}
          <Text style={{ color: C.muted, fontSize: 14 }}>{tr('Sit tall and comfortable. Turn the sound up to hear Myra\'s voice.')}</Text>
          <Pressable onPress={() => { setI(0); setPlaying(true); }} accessibilityRole="button"
            style={({ pressed }) => ({ backgroundColor: C.glow, borderRadius: 99, paddingVertical: 16, alignItems: 'center', opacity: pressed ? 0.8 : 1, marginTop: 8 })}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{tr('Start session')}</Text>
          </Pressable>
        </View>
      ) : done ? (
        <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 12 }}>
          <Ionicons name="checkmark-circle" size={56} color={C.calm} />
          <Text style={{ color: C.ink, fontSize: 26, fontWeight: '600' }}>{tr('Well done. Sit for a moment before you get up.')}</Text>
          <Text style={{ color: C.muted, fontSize: 16 }}>{tr('Your minutes are added to Breathing & meditation.')}</Text>
        </View>
      ) : (
        <>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ color: C.muted, fontSize: 14, letterSpacing: 1 }}>{seg ? tr(segmentName(seg.id)).toUpperCase() : ''}</Text>
            <Text style={{ color: C.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{Math.floor(left / 60)}:{String(Math.round(left % 60)).padStart(2, '0')}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {/* Nostrils for Anulom Vilom */}
            {step?.phase.side ? (
              <View style={{ flexDirection: 'row', gap: D * 0.9, position: 'absolute', top: '18%' }}>
                {(['left', 'right'] as const).map(sd => (
                  <Text key={sd} style={{ color: step.phase.side === sd ? C.glow : C.muted, opacity: step.phase.side === sd ? 1 : 0.35, fontSize: 18, fontWeight: '700' }}>{sd === 'left' ? tr('Left') : tr('Right')}</Text>
                ))}
              </View>
            ) : null}
            <View style={{ width: D, height: D, borderRadius: D / 2, borderWidth: 2, borderColor: C.ring, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{ width: D, height: D, borderRadius: D / 2, backgroundColor: step?.phase.kind === 'hum' || step?.phase.kind === 'chant' ? C.glow + '55' : C.calm + '55', transform: [{ scale: size }] }} />
            </View>
            <Text style={{ color: C.ink, fontSize: step?.intro ? 18 : 26, fontWeight: '600', textAlign: 'center', marginTop: 28, paddingHorizontal: 28, lineHeight: step?.intro ? 26 : 34 }}>
              {step ? tr(step.phase.cue) : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 36, paddingBottom: 28 }}>
            <Pressable onPress={() => setVoiceOn(v => !v)} hitSlop={10} accessibilityLabel={voiceOn ? tr('Voice off') : tr('Voice on')}>
              <Ionicons name={voiceOn ? 'volume-high-outline' : 'volume-mute-outline'} size={26} color={C.muted} />
            </Pressable>
            <Pressable onPress={() => setPlaying(x => !x)} hitSlop={10} accessibilityLabel={playing ? tr('Pause') : tr('Continue')}
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.ring, alignItems: 'center', justifyContent: 'center', marginTop: -18 }}>
              <Ionicons name={playing ? 'pause' : 'play'} size={28} color={C.ink} />
            </Pressable>
            <Pressable onPress={close} hitSlop={10} accessibilityLabel={tr('End and save')}>
              <Ionicons name="stop-circle-outline" size={26} color={C.muted} />
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
