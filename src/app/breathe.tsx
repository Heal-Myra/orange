// Happy Orange guided pranayama player (founder, 24 Oct 2026): our own guided session. A breathing circle grows on the
// in-breath and settles on the out-breath, the nostril to use lights up for Anulom Vilom, quick breaths pulse for
// Bhastrika and Kapalbhati, and Myra's voice gives each cue. Minutes count toward Breathing & meditation.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lang, tr } from '../lib/i18n';
import { useGuideText } from '../lib/guideText';
import { optional } from '../lib/native';
import { phasesFor, practice, segmentName, sessionPlan, type Phase, type PracticeId, type Segment } from '../lib/pranayama';
import { useHeal } from '../lib/store';
import { gentleToday } from '../lib/feeling';
import { carePlan } from '../lib/care';
import { todayISO } from '../lib/dates';
import { hasVoice, speak, voiceLang } from '../lib/voice';
import { useServerVoice } from '../lib/serverVoice';
import { hasGuide, sessionStep } from '../lib/practiceGuide';
import { GuideFigure } from '../components/GuideFigure';

const Awake = optional(['ExpoKeepAwake'], () => require('expo-keep-awake') as typeof import('expo-keep-awake'));
// Sky blue with black text (founder's choice, 25 Oct 2026).
const C = { bg: '#C4E4F8', ring: '#A9D3EE', ink: '#111111', muted: '#41606E', glow: '#E0794F', calm: '#2F86B5' };
const QUICK = (ph: Phase) => ph.seconds < 2;

interface Step { seg: number; phase: Phase; intro?: string; rep?: number } // rep: how many times this cue came before in the part

export default function Breathe() {
  const { practice: pid, minutes, lang: gl } = useLocalSearchParams<{ practice?: string; minutes?: string; lang?: string }>();
  const gLang: string = gl || lang();
  const { update } = useHeal();
  const choice = (pid ?? 'mix') as PracticeId;
  const mins = Math.max(1, Math.min(60, Number(minutes) || 10));
  const { days } = useHeal();
  const gentle = gentleToday(days[todayISO()]?.feeling);
  const feel = days[todayISO()]?.feeling;
  const care = useMemo(() => carePlan(feel?.symptoms ?? [])?.breath.filter(b => (b as string) !== 'nidra'), [feel]);
  const plan = useMemo<Segment[]>(() => sessionPlan(choice, mins, undefined, gentle, care), [choice, mins, gentle, care]);
  // Each part opens with a short spoken "how to", then its breaths.
  const steps = useMemo<Step[]>(() => plan.flatMap((seg, k): Step[] => {
    const how = seg.id === 'still' ? '' : practice(seg.id).how;
    // Slow voice with pauses: about 1.7 words a second, plus a pause per sentence (founder: "speed is too fast").
    const introSec = how ? Math.min(24, Math.max(8, Math.round(how.split(/\s+/).length / 1.7 + (how.match(/[.!?]/g)?.length ?? 1) * 0.7))) : 0;
    const head: Step[] = how ? [{ seg: k, intro: how, phase: { kind: 'rest', seconds: introSec, cue: how } }] : [];
    const seen: Record<string, number> = {};
    return [...head, ...phasesFor({ ...seg, seconds: Math.max(10, seg.seconds - introSec) }).map(ph => ({ seg: k, phase: ph, rep: (seen[ph.cue] = (seen[ph.cue] ?? -1) + 1) }))];
  }), [plan]);
  const totalSec = useMemo(() => steps.reduce((t, s) => t + s.phase.seconds, 0), [steps]);
  // The guide character breathes along with the person (founder, 25 Oct 2026), one pose per phase.
  const figSteps = useMemo(() => steps.map(st => sessionStep(plan[st.seg].id, st.phase)), [steps, plan]);
  // Every line spoken or shown, in the session's own language (built in for English and Hindi; translated once otherwise).
  const allLines = useMemo(() => Array.from(new Set([...steps.map(s => s.phase.cue), 'Begin'])), [steps]);
  const { say, loading: translating, error: trError } = useGuideText(gLang, allLines);
  // Myra's natural voice (25 Oct 2026): each line made once on our server, then played from the saved file.
  const spokenLines = useMemo(() => (translating ? [] : allLines.map(say)), [allLines, translating, gLang]); // eslint-disable-line react-hooks/exhaustive-deps
  const { preparing } = useServerVoice(gLang, spokenLines, !translating);

  const [i, setI] = useState(-1); // -1 = not started
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [noVoice, setNoVoice] = useState(false);
  const size = useRef(new Animated.Value(0.6)).current;
  const sat = useRef(0), since = useRef<number | null>(null), saved = useRef(false);
  const voice = voiceLang(gLang);
  const done = i >= steps.length;
  useEffect(() => { hasVoice(voice).then(v => setNoVoice(!v)).catch(() => {}); }, [voice]);

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
    // Every cue for the first three rounds; after that only every third round, so the rhythm can carry (founder: narration quality).
    const quiet = !intro && !QUICK(phase) && phase.kind !== 'rest' && (steps[i].rep ?? 0) >= 3 && (steps[i].rep ?? 0) % 3 !== 0;
    const line = quiet ? null : intro ? say(intro) : QUICK(phase) ? (firstOfRun && prev && QUICK(prev) ? null : firstOfRun ? say('Begin') : null) : say(phase.cue);
    let stop = () => {};
    if (voiceOn && line) stop = speak(line, voice, () => {});
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
          <Text style={{ color: C.ink, fontSize: 30, fontWeight: '600' }}>{pr ? tr(pr.name) : care?.length ? tr('Care breathing') : tr("Myra's mix")}</Text>
          <Text style={{ color: C.muted, fontSize: 16 }}>{tr('{n} minutes', { n: mins })} · {plan.filter(s => s.id !== 'still').map(s => tr(segmentName(s.id))).join(' → ')} → {tr('Stillness')}</Text>
          {pr && hasGuide(pr.id) ? (
            <Pressable onPress={() => router.push({ pathname: '/explain', params: { practice: pr.id, lang: gLang } })} accessibilityRole="button">
              <Text style={{ color: C.glow, fontSize: 15, fontWeight: '700' }}>▶ {tr('How to do it')}</Text>
            </Pressable>
          ) : null}
          {pr?.caution ? <Text style={{ color: C.glow, fontSize: 14, lineHeight: 20 }}>{tr(pr.caution)}</Text> : null}
          {!pr && plan.some(s => s.id !== 'still' && practice(s.id).energising) ? <Text style={{ color: C.glow, fontSize: 14, lineHeight: 20 }}>{tr('Bhastrika and Kapalbhati are strong breaths: skip them if pregnant, or with high blood pressure, heart disease, hernia or recent surgery. Empty stomach. Stop if dizzy.')}</Text> : null}
          <Text style={{ color: C.muted, fontSize: 14 }}>{tr('Sit tall and comfortable. Turn the sound up to hear Myra\'s voice.')}</Text>
          {translating ? <Text style={{ color: C.muted, fontSize: 14 }}>{tr('Myra is preparing the session in your language…')}</Text>
            : preparing ? <Text style={{ color: C.muted, fontSize: 14 }}>{tr('Preparing Myra\'s voice…')}</Text> : null}
          {trError ? <Text style={{ color: C.glow, fontSize: 14 }}>{trError}</Text> : null}
          {noVoice ? <Text style={{ color: C.muted, fontSize: 14 }}>{tr('This phone has no voice for this language yet, so the words will show on screen. In iPhone Settings › Accessibility › Spoken Content › Voices you can add one.')}</Text> : null}
          <Pressable disabled={translating || preparing} onPress={() => { setI(0); setPlaying(true); }} accessibilityRole="button"
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
            {/* Myra's guide character does the practice with the person: hands, nostrils, breath, hum (placeholder art, decision 0032). */}
            {i >= 0 && i < figSteps.length ? <GuideFigure step={figSteps[i]} playing={playing} size={Math.min(300, D + 40)} /> : null}
            <Text style={{ color: C.ink, fontSize: step?.intro ? 18 : 26, fontWeight: '600', textAlign: 'center', marginTop: 28, paddingHorizontal: 28, lineHeight: step?.intro ? 26 : 34 }}>
              {step ? say(step.phase.cue) : ''}
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
