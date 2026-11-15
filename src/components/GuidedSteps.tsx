// A calm, voiced step-by-step page (16 Nov 2026), used by the Calm-down button and the Forgiveness practice: each step
// is spoken in Myra's voice (or the phone's), shown large, and moves on by itself after its time (or with Next).

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FullScreen } from './FullScreen';
import { lang, tr } from '../lib/i18n';
import { speak, voiceLang } from '../lib/voice';
import { colors } from '../theme';

export interface Step { big?: string; title: string; say: string; hint?: string; secs: number }

export function GuidedSteps({ steps, heading, bg = '#DDEAF4', onDone, doneLine }: { steps: Step[]; heading: string; bg?: string; onDone?: () => void; doneLine: string }) {
  const [i, setI] = useState(-1); // -1: ready
  const [voice, setVoice] = useState(true);
  const stop = useRef<() => void>(() => {});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = i >= steps.length;
  useEffect(() => {
    stop.current(); if (timer.current) clearTimeout(timer.current);
    if (i < 0 || done) { if (done) onDone?.(); return; }
    const s = steps[i];
    if (voice) stop.current = speak(tr(s.say), voiceLang(lang()), () => {});
    timer.current = setTimeout(() => setI(x => x + 1), s.secs * 1000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { stop.current(); if (timer.current) clearTimeout(timer.current); }, []);
  const s = steps[i];
  return (
    <FullScreen style={{ backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
        <Pressable onPress={() => { setVoice(v => !v); stop.current(); }} hitSlop={10} accessibilityRole="button"><Text style={{ color: colors.ink, fontSize: 15 }}>{voice ? tr('Voice on') : tr('Voice off')}</Text></Pressable>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button"><Text style={{ color: colors.ink, fontSize: 15 }}>{tr('Close')}</Text></Pressable>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 14 }}>
        {i < 0 ? (
          <>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>{heading}</Text>
            <Pressable onPress={() => setI(0)} accessibilityRole="button" style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 48, marginTop: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{tr('Begin')}</Text>
            </Pressable>
          </>
        ) : done ? (
          <>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.insight, textAlign: 'center' }}>✦ {doneLine}</Text>
            <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 44, marginTop: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{tr('Done')}</Text>
            </Pressable>
          </>
        ) : (
          <>
            {s.big ? <Text style={{ fontSize: 64, fontWeight: '800', color: colors.ink }}>{s.big}</Text> : null}
            <Text style={{ fontSize: 21, color: colors.ink, textAlign: 'center', fontWeight: '600' }}>{tr(s.title)}</Text>
            {s.hint ? <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center' }}>{tr(s.hint)}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
              {steps.map((_, k) => <View key={k} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: k <= i ? colors.accent : '#9DB6C6' }} />)}
            </View>
            <Pressable onPress={() => setI(i + 1)} hitSlop={10} accessibilityRole="button" style={{ marginTop: 18 }}><Text style={{ color: colors.accent, fontWeight: '700', fontSize: 16 }}>{tr('Next')} ›</Text></Pressable>
          </>
        )}
      </View>
    </FullScreen>
  );
}
