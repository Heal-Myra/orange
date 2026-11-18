// The rebuilt Myra's mix player (founder, 18 Nov 2026; decision 0061). One exact timeline (src/lib/mixScript.ts):
// Myra's calm voice only at the start and end of each round, a soft tick for the quick breaths, a gentle chime at each
// nostril switch, the breath circle on every breath, and a tanpura underneath the whole way.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, Text, View } from 'react-native';
import { FullScreen } from './FullScreen';
import { tr } from '../lib/i18n';
import { useGuideText } from '../lib/guideText';
import { optional } from '../lib/native';
import { MIX_NAMES, MIX_SOURCES, mixLines, mixScript, type MixEvent } from '../lib/mixScript';
import { useHeal } from '../lib/store';
import { addSession } from '../lib/medSessions';
import { speak, voiceLang } from '../lib/voice';
import { useServerVoice } from '../lib/serverVoice';

const Audio = optional(['ExpoAudio'], () => require('expo-audio') as typeof import('expo-audio'));
const Awake = optional(['ExpoKeepAwake'], () => require('expo-keep-awake') as typeof import('expo-keep-awake'));
type Player = ReturnType<NonNullable<typeof Audio>['createAudioPlayer']>;
const C = { bg: '#C4E4F8', ring: '#A9D3EE', ink: '#111111', muted: '#41606E', glow: '#E0794F', calm: '#2F86B5' };
const CAUTION = 'Bhastrika and Kapalbhati are strong breaths: skip them with heart problems, high blood pressure, dizziness, hernia, ulcers, pregnancy or right after a meal. Skip Bhramari with an ear or nose infection. Never force the breath; stop if dizzy.';

export function MixSession({ minutes, gLang }: { minutes: number; gLang: string }) {
  const { update } = useHeal();
  const { events, total } = useMemo(() => mixScript(minutes), [minutes]);
  const lines = useMemo(() => mixLines(minutes), [minutes]);
  const { say, loading: translating } = useGuideText(gLang, lines);
  const spoken = useMemo(() => (translating ? [] : events.filter(e => e.say).map(e => say(e.say!))), [events, translating, gLang]); // eslint-disable-line react-hooks/exhaustive-deps
  const { preparing } = useServerVoice(gLang, Array.from(new Set(spoken)), !translating);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [now, setNow] = useState<MixEvent | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const size = useRef(new Animated.Value(0.6)).current;
  const played = useRef(0), last = useRef(0), next = useRef(0), stopVoice = useRef<() => void>(() => {}), saved = useRef(false);
  const sounds = useRef<{ tanpura?: Player; tick?: Player; chime?: Player }>({});
  const voiceRef = useRef(true);

  // The three sounds, loaded once.
  useEffect(() => {
    if (!Audio) return;
    Audio.setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true } as never).catch(() => {});
    const t = Audio.createAudioPlayer(require('../../assets/sounds/tanpura.m4a')); t.loop = true; t.volume = 0.22;
    const k = Audio.createAudioPlayer(require('../../assets/sounds/tick.m4a')); k.volume = 0.55;
    const c = Audio.createAudioPlayer(require('../../assets/sounds/chime.m4a')); c.volume = 0.5;
    sounds.current = { tanpura: t, tick: k, chime: c };
    return () => { for (const p of [t, k, c]) { try { p.pause(); p.remove(); } catch { /* fine */ } } };
  }, []);
  const hit = (p?: Player) => { if (!p) return; try { p.seekTo(0); p.play(); } catch { /* fine */ } };

  const fire = (e: MixEvent) => {
    setNow(e);
    if (e.tick) hit(sounds.current.tick);
    if (e.chime) hit(sounds.current.chime);
    if (e.circle) Animated.timing(size, { toValue: e.circle.to, duration: e.circle.secs * 1000, easing: e.circle.secs <= 1 ? Easing.out(Easing.quad) : Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }).start();
    if (e.say && voiceRef.current) { stopVoice.current(); stopVoice.current = speak(say(e.say), voiceLang(gLang), () => {}, { pace: 'guide', pauseMs: 1200 }); }
  };

  const save = () => {
    if (saved.current) return;
    const m = Math.round(played.current / 60000);
    if (m > 0) { saved.current = true; update(d => addSession(d, 'guided', "Myra's mix", m)); }
  };

  // One clock for the whole session; events fire when their time comes, pausing stops the clock and the tanpura.
  useEffect(() => {
    if (!playing) { try { sounds.current.tanpura?.pause(); } catch { /* fine */ } return; }
    try { sounds.current.tanpura?.play(); } catch { /* fine */ }
    Awake?.activateKeepAwakeAsync('mix').catch(() => {});
    last.current = Date.now();
    const id = setInterval(() => {
      const t = Date.now();
      played.current += t - last.current; last.current = t;
      const sec = played.current / 1000;
      while (next.current < events.length && events[next.current].at <= sec) fire(events[next.current++]);
      setElapsed(sec);
      if (sec >= total) { clearInterval(id); setPlaying(false); setDone(true); save(); try { sounds.current.tanpura?.pause(); } catch { /* fine */ } }
    }, 100);
    return () => { clearInterval(id); try { Awake?.deactivateKeepAwake('mix'); } catch { /* fine */ } };
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { stopVoice.current(); }, []);

  const close = () => { setPlaying(false); stopVoice.current(); if (started) save(); router.canGoBack() ? router.back() : router.replace('/'); };
  const left = Math.max(0, Math.round(total - elapsed));
  const parts = Array.from(new Set(events.map(e => e.part))).filter(p => p !== 'close');
  const D = 230;

  return (
    <FullScreen style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <Text style={{ color: C.glow, fontWeight: '700', letterSpacing: 1 }}>{tr('HAPPY ORANGE · BREATHE')}</Text>
        <Pressable onPress={close} hitSlop={12} accessibilityLabel={tr('Close')}><Ionicons name="close" size={26} color={C.muted} /></Pressable>
      </View>
      {!started ? (
        <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 14 }}>
          <Text style={{ color: C.ink, fontSize: 30, fontWeight: '600' }}>{tr("Myra's mix")}</Text>
          <Text style={{ color: C.muted, fontSize: 16, lineHeight: 23 }}>{tr('{n} minutes', { n: Math.round(total / 60) })} · {parts.map(p => tr(MIX_NAMES[p])).join(' → ')}</Text>
          <Text style={{ color: C.muted, fontSize: 13, lineHeight: 19 }}>{tr('From the Hatha Yoga Pradipika and the Ayush Common Yoga Protocol.')}</Text>
          <Text style={{ color: C.glow, fontSize: 14, lineHeight: 20 }}>{tr(CAUTION)}</Text>
          <Text style={{ color: C.muted, fontSize: 14 }}>{tr('Sit tall on an empty stomach. Turn the sound up: Myra guides, a soft tick keeps the pace, a tanpura plays underneath.')}</Text>
          {translating || preparing ? <Text style={{ color: C.muted, fontSize: 14 }}>{tr("Preparing Myra's voice…")}</Text> : null}
          <Pressable disabled={translating || preparing} onPress={() => { setStarted(true); setPlaying(true); }} accessibilityRole="button"
            style={({ pressed }) => ({ backgroundColor: translating || preparing ? C.ring : C.glow, borderRadius: 99, paddingVertical: 16, alignItems: 'center', opacity: pressed ? 0.8 : 1, marginTop: 8 })}>
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
            <Text style={{ color: C.muted, fontSize: 14, letterSpacing: 1 }}>{now ? tr(MIX_NAMES[now.part]).toUpperCase() : ''}</Text>
            <Text style={{ color: C.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: D, height: D, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{ position: 'absolute', width: D, height: D, borderRadius: D / 2, backgroundColor: C.ring, opacity: 0.55, transform: [{ scale: size }] }} />
              <Animated.View style={{ width: D * 0.62, height: D * 0.62, borderRadius: D * 0.31, backgroundColor: '#fff', opacity: 0.9, transform: [{ scale: size }] }} />
              {now?.side ? (
                <View style={{ position: 'absolute', flexDirection: 'row', width: D, justifyContent: 'space-between', paddingHorizontal: 6 }}>
                  <Text style={{ color: now.side === 'left' ? C.glow : C.muted, fontWeight: '700', opacity: now.side === 'left' ? 1 : 0.35 }}>{tr('LEFT')}</Text>
                  <Text style={{ color: now.side === 'right' ? C.glow : C.muted, fontWeight: '700', opacity: now.side === 'right' ? 1 : 0.35 }}>{tr('RIGHT')}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: C.ink, fontSize: 26, fontWeight: '600', textAlign: 'center', marginTop: 30, paddingHorizontal: 28 }}>{now?.show ? say(now.show) : ''}</Text>
            {now ? <Text style={{ color: C.muted, fontSize: 12, marginTop: 10, textAlign: 'center', paddingHorizontal: 28 }}>{tr(MIX_SOURCES[now.part])}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 36, paddingBottom: 28 }}>
            <Pressable onPress={() => { voiceRef.current = !voiceOn; setVoiceOn(!voiceOn); if (voiceOn) stopVoice.current(); }} hitSlop={10} accessibilityLabel={voiceOn ? tr('Voice off') : tr('Voice on')}>
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
    </FullScreen>
  );
}
