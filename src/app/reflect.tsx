// Sunday voice reflection (founder, 15 Nov 2026 idea 5; built 16 Nov): speak for up to 2 minutes about the week;
// Myra writes three lines into the journal (proud of, hard, next week). Keep or edit. The recording is not kept.

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Button, Card, Note, Screen } from '../components/ui';
import { speechRecognition } from '../components/MealPhoto';
import { weekReflect } from '../lib/ai';
import { lang, tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';

const MAX = 120;

export default function Reflect() {
  const { update } = useHeal();
  const Speech = speechRecognition();
  const [phase, setPhase] = useState<'ready' | 'listening' | 'writing' | 'review'>('ready');
  const [heard, setHeard] = useState('');
  const [secs, setSecs] = useState(0);
  const [lines, setLines] = useState({ proud: '', hard: '', next: '' });
  const [err, setErr] = useState<string | null>(null);
  const live = useRef(false), rec = useRef<any>(null), text = useRef('');
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { live.current = false; try { rec.current?.abort?.(); } catch { /* stopped */ } if (tick.current) clearInterval(tick.current); }, []);

  // Recognition stops after a pause, so it starts again until the person taps stop or 2 minutes pass.
  const listen = () => {
    if (!live.current || !Speech) return;
    const r = new Speech();
    r.lang = lang() === 'hi' ? 'hi-IN' : 'en-IN'; r.interimResults = false;
    r.onresult = (e: any) => { const t = e.results?.[0]?.[0]?.transcript ?? ''; if (t) { text.current = `${text.current} ${t}`.trim(); setHeard(text.current); } };
    r.onerror = () => {};
    r.onend = () => { rec.current = null; if (live.current) setTimeout(listen, 250); };
    rec.current = r;
    try { r.start(); } catch { /* try again on end */ }
  };
  const start = () => {
    setErr(null); text.current = ''; setHeard(''); setSecs(0);
    live.current = true; setPhase('listening'); listen();
    tick.current = setInterval(() => setSecs(s => { if (s + 1 >= MAX) { stop(); } return s + 1; }), 1000);
  };
  const stop = () => {
    if (!live.current) return;
    live.current = false; if (tick.current) clearInterval(tick.current);
    try { rec.current?.stop?.(); } catch { /* stopped */ }
    setTimeout(() => write(text.current), 700);
  };
  const write = async (said: string) => {
    if (!said.trim()) { setPhase('ready'); setErr(tr('I did not catch anything. Try again, or type it.')); return; }
    setPhase('writing');
    try { const r = await weekReflect(said); setLines({ proud: r.proud ?? '', hard: r.hard ?? '', next: r.next ?? '' }); setPhase('review'); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); setPhase('ready'); }
  };
  const keep = () => {
    update(d => { d.soul = { ...(d.soul ?? {}), reflection: { proud: lines.proud.trim() || undefined, hard: lines.hard.trim() || undefined, next: lines.next.trim() || undefined } }; });
    router.back();
  };
  const field = (k: 'proud' | 'hard' | 'next', label: string) => (
    <View style={{ gap: 4 }}>
      <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>{label}</Text>
      <TextInput value={lines[k]} onChangeText={v => setLines(x => ({ ...x, [k]: v }))} multiline
        style={{ backgroundColor: colors.field, borderRadius: 12, padding: 10, fontSize: 15, color: colors.ink, fontStyle: 'italic' }} />
    </View>
  );
  return (
    <Screen noBanner>
      {phase === 'review' ? (
        <Card style={{ gap: 10 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>{tr('MYRA WROTE IN YOUR JOURNAL')}</Text>
          {field('proud', tr('Proud of'))}
          {field('hard', tr('Hard'))}
          {field('next', tr('Next week'))}
          <Button title={tr('Keep')} onPress={keep} />
          <Note>{tr('Your recording is not kept.')}</Note>
        </Card>
      ) : (
        <Card style={{ alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>{tr('Your week, in your words')}</Text>
          <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center' }}>{tr('Speak for up to 2 minutes. What went well, what was hard, what\'s next?')}</Text>
          {phase === 'writing' ? <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 30 }}><ActivityIndicator color={colors.insight} /><Text style={{ color: colors.insight }}>{tr('Myra is writing…')}</Text></View> : (
            <Pressable onPress={phase === 'listening' ? stop : start} disabled={!Speech} accessibilityRole="button" accessibilityLabel={phase === 'listening' ? tr('Stop') : tr('Speak')}
              style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: Speech ? (phase === 'listening' ? colors.insight : '#E8833F') : colors.line, alignItems: 'center', justifyContent: 'center', marginVertical: 12 }}>
              <Text style={{ fontSize: 32, color: colors.onAccent }}>{phase === 'listening' ? '■' : '🎙'}</Text>
            </Pressable>
          )}
          {phase === 'listening' ? <Text style={{ color: colors.muted }}>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')} · {tr('tap to stop')}</Text> : null}
          {heard ? <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }} numberOfLines={4}>“{heard}”</Text> : null}
          {err ? <Note>{err}</Note> : null}
          {!Speech || phase === 'ready' ? <TypeIt onDone={write} /> : null}
        </Card>
      )}
    </Screen>
  );
}

/** No speech on this phone, or the person prefers typing. */
function TypeIt({ onDone }: { onDone: (t: string) => void }) {
  const [t, setT] = useState('');
  const [open, setOpen] = useState(false);
  if (!open) return <Pressable onPress={() => setOpen(true)} hitSlop={8}><Text style={{ color: colors.accent, fontWeight: '600' }}>{tr('Or type it')}</Text></Pressable>;
  return (
    <View style={{ alignSelf: 'stretch', gap: 8 }}>
      <TextInput value={t} onChangeText={setT} multiline placeholder={tr('A few lines about your week…')} placeholderTextColor={colors.muted}
        style={{ minHeight: 90, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 10, fontSize: 15, color: colors.ink }} />
      <Button title={tr('Write it up')} onPress={() => onDone(t)} disabled={t.trim().length < 5} />
    </View>
  );
}
