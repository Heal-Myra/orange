// A calm, voiced step-by-step page (16 Nov 2026), used by the Calm-down button and the Forgiveness practice: each step
// is spoken in Myra's own voice, slowly, shown large with a quiet bar for its time, and moves on by itself (or Next).
// Founder, 16 Nov 2026: the cards did not seem to move and the phone's voice was not Myra's; now Myra's voice is made
// ready before Begin (the phone's voice only if hers cannot be reached) and each step shows its time running.

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FullScreen } from './FullScreen';
import { lang, tr } from '../lib/i18n';
import { speak, voiceLang } from '../lib/voice';
import { useServerVoice } from '../lib/serverVoice';
import { colors } from '../theme';

export interface Step { big?: string; title: string; say: string; again?: string; hint?: string; secs: number } // again: said gently halfway

export function GuidedSteps({ steps, heading, bg = '#DDEAF4', onDone, doneLine }: { steps: Step[]; heading: string; bg?: string; onDone?: () => void; doneLine: string }) {
  const [i, setI] = useState(-1); // -1: ready
  const [voice, setVoice] = useState(true);
  const voiceOn = useRef(true);
  const [left, setLeft] = useState(0);
  const stop = useRef<() => void>(() => {});
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const done = i >= steps.length;
  const code = lang();
  const { preparing } = useServerVoice(code, [...steps.flatMap(x => [tr(x.say), ...(x.again ? [tr(x.again)] : [])]), doneLine]);
  const say = (text: string) => { stop.current(); if (voiceOn.current) stop.current = speak(text, voiceLang(code), () => {}, { pace: 'guide', pauseMs: 1400 }); };
  useEffect(() => {
    stop.current(); if (tick.current) clearInterval(tick.current);
    if (i < 0) return;
    if (done) { onDone?.(); say(doneLine); return; }
    const st = steps[i];
    say(tr(st.say));
    // One clock for the step: the bar and the seconds left, the halfway line, then the next step by itself.
    const end = Date.now() + st.secs * 1000;
    let halfSaid = false;
    setLeft(st.secs);
    tick.current = setInterval(() => {
      const ms = end - Date.now();
      setLeft(Math.max(0, Math.ceil(ms / 1000)));
      if (st.again && !halfSaid && ms <= (st.secs * 1000) / 2) { halfSaid = true; say(tr(st.again)); }
      if (ms <= 0) { if (tick.current) clearInterval(tick.current); setI(x => x + 1); }
    }, 250);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { stop.current(); if (tick.current) clearInterval(tick.current); }, []);
  const s = steps[i];
  return (
    <FullScreen style={{ backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
        <Pressable onPress={() => { voiceOn.current = !voice; setVoice(!voice); stop.current(); stop.current = () => {}; }} hitSlop={10} accessibilityRole="button"><Text style={{ color: colors.ink, fontSize: 15 }}>{voice ? tr('Voice on') : tr('Voice off')}</Text></Pressable>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button"><Text style={{ color: colors.ink, fontSize: 15 }}>{tr('Close')}</Text></Pressable>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 14 }}>
        {i < 0 ? (
          <>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>{heading}</Text>
            <Pressable onPress={() => setI(0)} disabled={preparing} accessibilityRole="button" style={{ backgroundColor: preparing ? colors.line : colors.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 48, marginTop: 10 }}>
              <Text style={{ color: colors.onAccent, fontWeight: '700', fontSize: 17 }}>{tr('Begin')}</Text>
            </Pressable>
            {preparing ? <Text style={{ color: colors.muted, fontSize: 14 }}>{tr("Getting Myra's voice ready…")}</Text> : null}
          </>
        ) : done ? (
          <>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.insight, textAlign: 'center' }}>✦ {doneLine}</Text>
            <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 44, marginTop: 10 }}>
              <Text style={{ color: colors.onAccent, fontWeight: '700', fontSize: 16 }}>{tr('Done')}</Text>
            </Pressable>
          </>
        ) : (
          <>
            {s.big ? <Text style={{ fontSize: 64, fontWeight: '800', color: colors.ink }}>{s.big}</Text> : null}
            <Text style={{ fontSize: 21, color: colors.ink, textAlign: 'center', fontWeight: '600' }}>{tr(s.title)}</Text>
            {s.hint ? <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center' }}>{tr(s.hint)}</Text> : null}
            {/* The step's time, quietly running (founder, 16 Nov 2026: the cards did not seem to move). */}
            <View style={{ width: 200, height: 4, borderRadius: 2, backgroundColor: '#ffffff99', marginTop: 14 }}>
              <View style={{ width: `${(1 - left / s.secs) * 100}%`, height: 4, borderRadius: 2, backgroundColor: colors.accent }} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{left}s</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {steps.map((_, k) => <View key={k} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: k <= i ? colors.accent : '#9DB6C6' }} />)}
            </View>
            <Pressable onPress={() => setI(i + 1)} hitSlop={10} accessibilityRole="button" style={{ marginTop: 18 }}><Text style={{ color: colors.accent, fontWeight: '700', fontSize: 16 }}>{tr('Next')} ›</Text></Pressable>
          </>
        )}
      </View>
    </FullScreen>
  );
}
