// Myra's 1-minute cooking guide player (founder, 23 Oct 2026). Opens in the app from Tomorrow's food, and on the
// website from the WhatsApp link, without signing in. Scenes: the dish, the ingredients, each step, ready.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { FullScreen } from '../components/FullScreen';
import { decodeGuide, iconFor, scenes, VOICE_LANG } from '../lib/cookGuide';
import { hasVoice, speak } from '../lib/voice';
import { optional } from '../lib/native';
import { tr } from '../lib/i18n';

const Awake = optional(['ExpoKeepAwake'], () => require('expo-keep-awake') as typeof import('expo-keep-awake'));
const C = { bg: '#FFF7EF', card: '#FFFFFF', ink: '#2B2320', muted: '#7A6A62', accent: '#E0794F', line: '#F1E2D6' };

export default function Cook() {
  const { r } = useLocalSearchParams<{ r?: string }>();
  const guide = useMemo(() => (r ? decodeGuide(String(r)) : null), [r]);
  const list = useMemo(() => (guide ? scenes(guide) : []), [guide]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [voice, setVoice] = useState<boolean | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const lang = VOICE_LANG[guide?.l ?? 'en'] ?? 'en-IN';
  const [ING, STEP, OF] = guide?.t ?? ['Ingredients', 'Step', 'of', ''];

  useEffect(() => { hasVoice(lang).then(setVoice); }, [lang]);

  // Each scene: fade in, speak (or wait its time), then the next one.
  useEffect(() => {
    if (!playing || i >= list.length) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: Platform.OS !== 'web' }).start();
    const sc = list[i];
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stop = () => {};
    const next = () => { timer = setTimeout(() => setI(n => n + 1), 600); };
    if (voice) stop = speak(sc.say, lang, next);
    else timer = setTimeout(() => setI(n => n + 1), sc.seconds * 1000);
    return () => { stop(); if (timer) clearTimeout(timer); };
  }, [i, playing, voice, list, lang, fade]);

  useEffect(() => { if (i >= list.length && list.length) setPlaying(false); }, [i, list.length]);
  useEffect(() => {
    if (playing) Awake?.activateKeepAwakeAsync('cook').catch(() => {});
    else { try { Awake?.deactivateKeepAwake('cook'); } catch { /* fine */ } }
  }, [playing]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!guide) {
    return (
      <FullScreen style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', padding: 28 }}>
        <Text style={{ fontSize: 20, color: C.ink }}>{tr('This cooking guide link is incomplete. Please ask for it to be sent again.')}</Text>
      </FullScreen>
    );
  }

  const sc = list[Math.min(i, list.length - 1)];
  const done = i >= list.length;
  const start = () => { if (done) setI(0); setPlaying(true); };

  return (
    <FullScreen style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Progress, one segment per scene, like short videos. */}
      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingTop: 12 }}>
        {list.map((_, k) => (
          <View key={k} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: k < i || done ? C.accent : k === i && playing ? C.accent + '88' : C.line }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 }}>
        <Text style={{ color: C.accent, fontWeight: '700', letterSpacing: 0.5 }}>Happy Orange · 1 min</Text>
        {Platform.OS !== 'web' ? <Pressable onPress={close} hitSlop={12} accessibilityLabel={tr('Close')}><Ionicons name="close" size={26} color={C.muted} /></Pressable> : null}
      </View>

      <Pressable style={{ flex: 1 }} onPress={() => (playing ? setPlaying(false) : start())} accessibilityRole="button">
        <Animated.View style={{ flex: 1, opacity: playing || i > 0 ? fade : 1, justifyContent: 'center', paddingHorizontal: 28, gap: 18 }}>
          {!playing && i === 0 ? (
            <>
              <Text style={{ fontSize: 34, fontWeight: '700', color: C.ink, lineHeight: 42 }}>{guide.d}</Text>
              {guide.p ? <Text style={{ fontSize: 18, color: C.muted }}>{guide.p}</Text> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="play" size={30} color="#fff" style={{ marginLeft: 4 }} />
                </View>
                <Text style={{ fontSize: 16, color: C.muted, flex: 1 }}>{voice === false ? tr('Tap to play · words on screen') : tr('Tap to play · sound on')}</Text>
              </View>
            </>
          ) : sc.kind === 'title' ? (
            <>
              <Ionicons name="restaurant-outline" size={56} color={C.accent} />
              <Text style={{ fontSize: 34, fontWeight: '700', color: C.ink, lineHeight: 42 }}>{guide.d}</Text>
              {guide.p ? <Text style={{ fontSize: 18, color: C.muted }}>{guide.p}</Text> : null}
            </>
          ) : sc.kind === 'ingredients' ? (
            <>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.accent, letterSpacing: 1 }}>{ING.toUpperCase()}</Text>
              <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10 }}>
                {guide.i.map(([a, b], k) => (
                  <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8 }}>
                    <Text style={{ fontSize: 19, color: C.ink, flex: 1 }}>{a}</Text>
                    <Text style={{ fontSize: 19, color: C.muted }}>{b}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : sc.kind === 'step' ? (
            <>
              <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: C.card, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={iconFor(sc.text) as keyof typeof Ionicons.glyphMap} size={46} color={C.accent} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.accent, letterSpacing: 1 }}>{`${STEP} ${sc.step} ${OF} ${guide.s.slice(0, 8).length}`.toUpperCase()}</Text>
              <Text style={{ fontSize: 28, color: C.ink, lineHeight: 38, fontWeight: '600' }}>{sc.text}</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={64} color={C.accent} />
              <Text style={{ fontSize: 30, fontWeight: '700', color: C.ink, lineHeight: 40 }}>{sc.text}</Text>
            </>
          )}
        </Animated.View>
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 28, paddingBottom: 24 }}>
        <Pressable onPress={() => { setI(0); setPlaying(true); }} hitSlop={10} accessibilityLabel={tr('Replay')}><Ionicons name="refresh" size={26} color={C.muted} /></Pressable>
        <Pressable onPress={() => (playing ? setPlaying(false) : start())} hitSlop={10} accessibilityLabel={playing ? tr('Pause') : tr('Play')}>
          <Ionicons name={playing ? 'pause' : 'play'} size={26} color={C.ink} />
        </Pressable>
      </View>
      <Text style={{ textAlign: 'center', color: C.muted, fontSize: 12, paddingBottom: 12 }}>{tr('Made with Happy Orange · happyorange.in')}</Text>
    </FullScreen>
  );
}
