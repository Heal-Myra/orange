// "How to do it": Myra's explainer for one breathing practice (founder, 25 Oct 2026: our own explainer videos,
// minimalist). The guide character shows each step while Myra says it (natural voice where available); at the end,
// "Start a session" opens the guided practice. Steps come from src/lib/practiceGuide.ts.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GuideFigure } from '../components/GuideFigure';
import { useGuideText } from '../lib/guideText';
import { lang, tr } from '../lib/i18n';
import { GUIDES } from '../lib/practiceGuide';
import { practice, type PracticeId } from '../lib/pranayama';
import { useServerVoice } from '../lib/serverVoice';
import { useHeal } from '../lib/store';
import { speak, voiceLang } from '../lib/voice';

const C = { bg: '#EAF4FA', ink: '#24414A', muted: '#6B8794', glow: '#E0794F', track: '#CFE2EC' };

export default function Explain() {
  const { profile } = useHeal();
  const params = useLocalSearchParams<{ practice?: string; lang?: string }>();
  const id = (params.practice ?? 'anulom') as PracticeId;
  const steps = useMemo(() => GUIDES[id] ?? [], [id]);
  const gLang = params.lang || profile.me?.guideLang || lang();
  const lines = useMemo(() => steps.map(s => s.say), [steps]);
  const { say, loading: translating } = useGuideText(gLang, lines);
  const spoken = useMemo(() => (translating ? [] : lines.map(say)), [lines, translating, gLang]); // eslint-disable-line react-hooks/exhaustive-deps
  const { preparing } = useServerVoice(gLang, spoken, !translating);
  const voice = voiceLang(gLang);

  const [i, setI] = useState(-1);          // -1 = not started; steps.length = finished
  const [playing, setPlaying] = useState(false);
  const spokeDone = useRef(false), timeDone = useRef(false);

  // Each step lasts its own time, and at least as long as Myra takes to say it.
  useEffect(() => {
    if (!playing || i < 0 || i >= steps.length) return;
    spokeDone.current = false; timeDone.current = false;
    const next = () => { if (spokeDone.current && timeDone.current) setI(n => n + 1); };
    const stop = speak(say(steps[i].say), voice, () => { spokeDone.current = true; setTimeout(next, 400); });
    const t = setTimeout(() => { timeDone.current = true; next(); }, steps[i].seconds * 1000);
    return () => { clearTimeout(t); stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, playing]);
  useEffect(() => { if (i >= steps.length) setPlaying(false); }, [i, steps.length]);

  const pr = practice(id);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const begin = () => { setI(0); setPlaying(true); };
  const done = i >= steps.length;
  const step = steps[Math.max(0, Math.min(i, steps.length - 1))];
  const ready = !translating && !preparing;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <Text style={{ color: C.glow, fontWeight: '700', letterSpacing: 1.2, fontSize: 12 }}>{tr('HOW TO')} · {tr(pr.name).toUpperCase()}</Text>
        <Pressable onPress={close} hitSlop={12} accessibilityLabel={tr('Close')}><Ionicons name="close" size={26} color={C.muted} /></Pressable>
      </View>
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 24, gap: 18 }}>
        {step ? <GuideFigure step={step} playing={playing && !done} /> : null}
        <Text style={{ color: C.ink, fontSize: 19, lineHeight: 28, textAlign: 'center', minHeight: 84 }}>
          {i < 0 ? tr(pr.line) : done ? tr('Well done. You are ready to practise.') : say(step.say)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {steps.map((_, k) => <View key={k} style={{ width: 22, height: 3, borderRadius: 3, backgroundColor: k <= i ? C.glow : C.track }} />)}
        </View>
      </View>
      <View style={{ padding: 24, gap: 12 }}>
        {i < 0 ? (
          <Pressable disabled={!ready} onPress={begin} accessibilityRole="button" style={({ pressed }) => ({ backgroundColor: C.glow, borderRadius: 99, paddingVertical: 16, alignItems: 'center', opacity: !ready ? 0.6 : pressed ? 0.8 : 1 })}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{ready ? tr('Watch how (1 minute)') : tr('Preparing Myra\'s voice…')}</Text>
          </Pressable>
        ) : done ? (
          <>
            <Pressable onPress={() => router.replace({ pathname: '/breathe', params: { practice: id, minutes: '5', lang: gLang } })} accessibilityRole="button"
              style={({ pressed }) => ({ backgroundColor: C.glow, borderRadius: 99, paddingVertical: 16, alignItems: 'center', opacity: pressed ? 0.8 : 1 })}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{tr('Start a 5-minute session')}</Text>
            </Pressable>
            <Pressable onPress={begin} accessibilityRole="button" style={{ alignItems: 'center', padding: 6 }}>
              <Text style={{ color: C.muted, fontSize: 15 }}>{tr('Watch again')}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => setPlaying(x => !x)} accessibilityRole="button" accessibilityLabel={playing ? tr('Pause') : tr('Play')} style={{ alignSelf: 'center', padding: 8 }}>
            <Ionicons name={playing ? 'pause-circle' : 'play-circle'} size={56} color={C.glow} />
          </Pressable>
        )}
        <Text style={{ color: C.muted, fontSize: 12, textAlign: 'center' }}>{tr('Everyday self-care, not medical advice.')}</Text>
      </View>
    </SafeAreaView>
  );
}
