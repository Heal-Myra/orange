// "How I lived it today" for Daily Wisdom and Tao (founder, 16 Nov 2026): speak it or write it, and Myra reads how
// deeply it was lived (a subjective assessment, not a word count). Her reading sets the 30 "living it" points.

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TextField } from './ui';
import { speechRecognition } from './MealPhoto';
import { rateLived } from '../lib/ai';
import { lang, tr } from '../lib/i18n';
import { lived } from '../lib/scoring';
import type { LivedRate } from '../lib/types';
import { colors } from '../theme';

const LEVEL = ['Not lived yet', 'An intention', 'Lived', 'Lived deeply'] as const;

export function LivedBox({ value, rate, teaching, placeholder, onText, onRate }: {
  value: string; rate?: LivedRate; teaching: string; placeholder: string;
  onText: (t: string) => void; onRate: (r: LivedRate) => void;
}) {
  const Speech = speechRecognition();
  const [listening, setListening] = useState(false);
  const [reading, setReading] = useState(false);
  const rec = useRef<any>(null);
  const text = value.trim();
  const fresh = rate && rate.of === text;

  // Read it once the person pauses (2.5 s after the last change), and again only when the words change.
  useEffect(() => {
    if (!lived(text) || fresh) return;
    const t = setTimeout(() => {
      setReading(true);
      rateLived(teaching, text).then(r => {
        const level = Math.max(0, Math.min(3, Math.round(Number(r.level) || 0))) as LivedRate['level'];
        onRate({ of: text, level, line: String(r.line ?? '').slice(0, 120) });
      }).catch(() => {}).finally(() => setReading(false));
    }, 2500);
    return () => clearTimeout(t);
  }, [text, fresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const speak = () => {
    if (!Speech) return;
    if (listening) { try { rec.current?.stop?.(); } catch { /* stopped */ } return; }
    let r: any;
    try { r = new Speech(); } catch { return; }
    r.lang = lang() === 'hi' ? 'hi-IN' : 'en-IN'; r.interimResults = false;
    r.onresult = (e: any) => { const t = e.results?.[0]?.[0]?.transcript ?? ''; if (t) onText(text ? `${text} ${t}` : t); };
    r.onerror = () => setListening(false);
    r.onend = () => { setListening(false); rec.current = null; };
    rec.current = r; setListening(true);
    try { r.start(); } catch { setListening(false); }
    setTimeout(() => { if (rec.current === r) { try { r.stop(); } catch { /* stopped */ } } }, 30_000);
  };

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flex: 1 }}><TextField label="" value={value} multiline onChangeText={onText} placeholder={placeholder} /></View>
        {Speech ? (
          <Pressable onPress={speak} accessibilityRole="button" accessibilityLabel={listening ? tr('Stop') : tr('Speak')}
            style={{ width: 44, height: 44, borderRadius: 22, marginTop: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: listening ? colors.insight : colors.insight + '14' }}>
            <Ionicons name={listening ? 'stop' : 'mic'} size={20} color={listening ? '#fff' : colors.insight} />
          </Pressable>
        ) : null}
      </View>
      {listening ? <Text style={{ color: colors.muted, fontSize: 13 }}>{tr('Listening… say how you lived it today')}</Text> : null}
      {reading ? <Text style={{ color: colors.muted, fontSize: 13 }}>{tr('Myra is reading it…')}</Text>
        : fresh && rate ? <Text style={{ color: colors.insight, fontSize: 14, fontWeight: '600' }}>✦ {tr(LEVEL[rate.level])}{rate.line ? ` · ${rate.line}` : ''}</Text> : null}
    </View>
  );
}
