// Voice mode for Myra (founder, 13 Nov 2026: "like Claude"): a real back-and-forth. Myra listens, the words go to her,
// and she answers aloud in her own voice (the server voice, or the phone's voice when that is not available), then
// listens again. 🎙 mutes the listening, ⌨ goes back to typing, ✕ ends.

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { speechRecognition } from './MealPhoto';
import { lang, tr } from '../lib/i18n';
import { playUrl, prepareVoice, sentences, serverVoiceFor, urlFor } from '../lib/serverVoice';
import { speak, voiceLang } from '../lib/voice';

type Phase = 'listening' | 'thinking' | 'speaking' | 'muted' | 'error';

/** Say a reply: Myra's server voice sentence by sentence, else the phone's voice. Returns a stop function. */
function say(text: string, done: () => void): () => void {
  const code = lang();
  let stopped = false, stopNow: () => void = () => {};
  (async () => {
    if (serverVoiceFor(code) && await prepareVoice(code, [text]).catch(() => false)) {
      const parts = sentences(text);
      const next = (i: number) => {
        if (stopped) return;
        const u = urlFor(code, parts[i] ?? '');
        if (i >= parts.length || !u) { done(); return; }
        stopNow = playUrl(u, () => next(i + 1));
      };
      next(0);
    } else if (!stopped) stopNow = speak(text, voiceLang(code), done);
  })();
  return () => { stopped = true; stopNow(); };
}

export function MyraVoice({ open, onClose, ask }: { open: boolean; onClose: () => void; ask: (q: string) => Promise<string> }) {
  const Speech = speechRecognition();
  const [phase, setPhase] = useState<Phase>('listening');
  const [heard, setHeard] = useState('');
  const [reply, setReply] = useState('');
  const rec = useRef<any>(null);
  const stopSay = useRef<() => void>(() => {});
  const live = useRef(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const stopListening = () => { try { rec.current?.abort?.(); } catch { /* stopped */ } rec.current = null; };
  const listen = () => {
    if (!live.current) return;
    if (!Speech) { setPhase('error'); return; }
    let r: any;
    try { r = new Speech(); } catch { setPhase('error'); return; }
    r.lang = lang() === 'hi' ? 'hi-IN' : 'en-IN'; r.interimResults = false; r.maxAlternatives = 1;
    let got = '';
    r.onresult = (e: any) => { got = e.results?.[0]?.[0]?.transcript ?? ''; };
    r.onerror = () => { rec.current = null; if (live.current) setTimeout(listen, 600); };
    r.onend = async () => {
      rec.current = null;
      if (!live.current) return;
      if (!got.trim()) { setTimeout(listen, 300); return; }
      setHeard(got); setPhase('thinking');
      const text = await ask(got).catch(e => (e instanceof Error ? e.message : tr('Something went wrong. Please try again.')));
      if (!live.current) return;
      setReply(text); setPhase('speaking');
      stopSay.current = say(text, () => { if (live.current) { setPhase('listening'); listen(); } });
    };
    rec.current = r; setPhase('listening');
    try { r.start(); } catch { setPhase('error'); return; }
    // One question at a time: stop listening after 15 seconds.
    setTimeout(() => { if (rec.current === r) { try { r.stop?.(); } catch { stopListening(); } } }, 15_000);
  };

  useEffect(() => {
    if (!open) return;
    live.current = true; setHeard(''); setReply('');
    listen();
    return () => { live.current = false; stopListening(); stopSay.current(); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const mute = () => {
    if (phase === 'muted') { setPhase('listening'); listen(); }
    else { stopListening(); stopSay.current(); setPhase('muted'); }
  };
  const label = phase === 'listening' ? tr('Listening…') : phase === 'thinking' ? tr('Thinking…') : phase === 'speaking' ? tr('Myra is speaking') : phase === 'muted' ? tr('Paused') : tr('Speech is not available on this phone.');
  const btn = (name: React.ComponentProps<typeof Ionicons>['name'], a11y: string, onPress: () => void, bg = '#34424A') => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y}
      style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={24} color="#fff" />
    </Pressable>
  );
  return (
    <Modal visible={open} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#1F2A30', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Animated.View style={{ width: 170, height: 170, borderRadius: 85, backgroundColor: '#E8833F', shadowColor: '#F0A060', shadowOpacity: 0.9, shadowRadius: 50,
          opacity: phase === 'muted' ? 0.4 : 1, transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: phase === 'speaking' ? [0.94, 1.08] : [0.97, 1.02] }) }] }} />
        <Text style={{ color: '#D6DBDD', fontSize: 16, marginTop: 30 }}>{label}</Text>
        {heard ? <Text style={{ color: '#9aa4a8', fontSize: 14, marginTop: 14, textAlign: 'center' }}>“{heard}”</Text> : null}
        {reply && phase !== 'listening' ? <Text style={{ color: '#fff', fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 22 }}>{reply}</Text> : null}
        <View style={{ position: 'absolute', bottom: 56, flexDirection: 'row', gap: 26 }}>
          {btn(phase === 'muted' ? 'mic-off' : 'mic', tr('Mute'), mute)}
          {btn('keypad-outline', tr('Back to typing'), onClose)}
          {btn('close', tr('End'), onClose, '#C0513A')}
        </View>
      </View>
    </Modal>
  );
}
