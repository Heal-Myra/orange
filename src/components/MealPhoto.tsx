// Log a meal by describing it (typed or spoken) or with a photo → calories, protein, carbs and fat.
// Numbers come from IFCT 2017 where an ingredient matches.
// The person checks and edits every number before it is added (understanding over tracking).

import * as ImagePicker from 'expo-image-picker';
import { useRef, useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { analyseMeal, analyseMealText, oneLine, type MealItem } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { NativeSpeech } from '../lib/nativeSpeech';
import { IfctPicker } from './IfctPicker';
import { Button, Card, Heading, Note, TextField, s } from './ui';
import { lang, tr } from '../lib/i18n';

import { shrink } from '../lib/photo';
export { shrink };

/**
 * Speech to text: Apple's recognition in the iPhone app; the browser's in Chrome and Android.
 * Not offered in Safari on iPhone/iPad: Safari's speech recognition often hangs, especially in home-screen apps,
 * and the keyboard's own microphone (dictation) works better there.
 */
export function speechRecognition(): (new () => any) | null {
  if (Platform.OS === 'ios') return NativeSpeech; // the iPhone app: Apple's own speech recognition
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof navigator === 'undefined') return null;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => any) | null;
}

/** One Food card: log a meal (photo, speak, type) on top, today's meals and totals underneath. */
export function MealPhoto({ right, top, children }: { right?: ReactNode; top?: ReactNode; children?: ReactNode }) {
  const { session } = useAuth();
  const { update } = useHeal();
  const [mode, setMode] = useState<'photo' | 'speak' | 'type' | null>(null);
  const [words, setWords] = useState('');
  const [listening, setListening] = useState(false);
  const rec = useRef<any>(null);
  const [source, setSource] = useState<'photo' | 'words'>('words');
  const [uri, setUri] = useState<string | null>(null);
  const hint = '';
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [items, setItems] = useState<MealItem[] | null>(null);
  const [insight, setInsight] = useState('');
  const [note, setNote] = useState('');
  const [noAi, setNoAi] = useState<string | null>(null); // why the AI could not be used: Type then searches IFCT directly

  const pick = async (camera: boolean) => {
    setMessage(null); setItems(null);
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, base64: true };
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setMessage(tr('Camera permission is needed to photograph a meal. You can choose a photo instead.')); return; }
    }
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled) return;
    const a = res.assets[0];
    setUri(a.uri); setSource('photo');
    setBusy(true); setMessage(tr('Reading your plate…'));
    try {
      const img = await shrink(a.uri, a.base64, a.mimeType);
      const r = await analyseMeal(img.data, img.type, hint);
      setItems(r.items); setNamed({});
      setInsight(r.insight);
      setNote([r.confidence && `Confidence: ${r.confidence}.`, r.note].filter(Boolean).join(' '));
      setMessage(r.items.length ? tr('Check the numbers, change anything that looks off, then add.') : (r.note || tr('No food found in the photo.')));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : tr('Something went wrong. Try again.'));
    } finally { setBusy(false); }
  };

  const describe = async (said?: string) => {
    const text = (said ?? words).trim();
    if (!text) return;
    setMessage(tr('Calculating your meal…')); setItems(null); setBusy(true); setSource('words'); setUri(null);
    try {
      // One quiet second try: the AI occasionally sends a reply that cannot be read (founder, 20 Oct 2026).
      const r = await analyseMealText(text).catch(e => { if (aiUnavailable(e)) throw e; return analyseMealText(text); });
      setItems(r.items); setNamed({});
      setInsight(r.insight);
      setNote([r.confidence && `Confidence: ${r.confidence}.`, r.note].filter(Boolean).join(' '));
      setMessage(r.items.length ? tr('Check the numbers, change anything that looks off, then add.') : (r.note || tr('No food found in that description.')));
    } catch (e) {
      if (aiUnavailable(e)) {
        // AI not available (key, limit, offline): search IFCT 2017 instead, in the same box.
        setMessage(null);
        setNoAi(tr('Myra can’t calculate right now. Meanwhile, pick from IFCT 2017:'));
      } else {
        setMessage(tr('Myra couldn’t work that out. Tap Calculate to try again.'));
      }
    } finally { setBusy(false); }
  };

  const Speech = speechRecognition();
  const stopListening = () => {
    try { rec.current?.abort?.(); } catch { /* already stopped */ }
    rec.current = null; setListening(false);
  };
  /** Stop, but still use the words heard so far (the Stop button and the 15-second limit). */
  const finishListening = () => {
    const r = rec.current;
    if (r?.stop) { try { r.stop(); return; } catch { /* fall through */ } }
    stopListening();
  };
  const speak = () => {
    if (!Speech) return;
    if (listening) { stopListening(); return; }
    let r: any;
    try { r = new Speech(); } catch { setMessage(tr('Speaking is not available here. Tap the microphone on your keyboard instead.')); return; }
    r.lang = lang() === 'hi' ? 'hi-IN' : 'en-IN'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e: any) => { const t = e.results?.[0]?.[0]?.transcript ?? ''; if (t) { setWords(t); describe(t); } };
    r.onerror = (problem?: string) => {
      setMessage(problem === 'permission' ? tr('Allow the microphone: Settings → Happy Orange → Microphone and Speech Recognition.')
        : problem === 'dictation-off' ? tr('Turn on Dictation: Settings → General → Keyboard → Enable Dictation.')
        : problem === 'no-speech' ? tr('I didn’t hear anything. Tap Speak and talk after the beep.')
        : tr('Could not hear that. You can also tap the microphone on your keyboard.'));
      stopListening();
    };
    r.onend = () => setListening(false);
    rec.current = r; setListening(true);
    try { r.start(); } catch { stopListening(); setMessage(tr('Speaking is not available here. Tap the microphone on your keyboard instead.')); return; }
    // Never stay stuck: stop listening after 15 seconds whatever happens.
    setTimeout(() => { if (rec.current === r) finishListening(); }, 15_000);
  };

  const edit = (i: number, key: keyof MealItem, value: string) => setItems(list => list && list.map((it, n) => n !== i ? it : {
    ...it, [key]: key === 'name' ? value : (parseFloat(value) || 0),
  }));

  // Founder, 31 Oct 2026: remove any item, and a corrected name gets its own nutrition (e.g. "Amli", not what the photo
  // seemed to show). The new numbers come from Myra (IFCT first) for the same grams.
  const [named, setNamed] = useState<Record<number, string>>({}); // the name each row's numbers belong to
  const [fixing, setFixing] = useState<number | null>(null);
  const remove = (i: number) => {
    setItems(list => list && list.filter((_, n) => n !== i));
    setNamed(m => Object.fromEntries(Object.entries(m).filter(([k]) => +k !== i).map(([k, v]) => [+k > i ? +k - 1 : +k, v])));
  };
  const renamed = async (i: number) => {
    const it = items?.[i];
    if (!it) return;
    const was = named[i] ?? '';
    const now = it.name.trim();
    if (!now || now.toLowerCase() === was.toLowerCase()) return;
    setFixing(i);
    try {
      const r = await analyseMealText(`${Math.round(it.grams || 100)} g ${now}`);
      const sum = (k: keyof MealItem) => (r.items ?? []).reduce((a, x) => a + (Number(x[k]) || 0), 0);
      if (!r.items?.length) throw new Error();
      setItems(list => list && list.map((x, n) => n !== i ? x : {
        ...x, name: now, kcal: Math.round(sum('kcal')), protein_g: +sum('protein_g').toFixed(1), carbs_g: +sum('carbs_g').toFixed(1),
        fat_g: +sum('fat_g').toFixed(1), fibre_g: +sum('fibre_g').toFixed(1), basis: r.items.every(x2 => x2.basis === 'IFCT') ? 'IFCT' : 'estimate',
      }));
      setNamed(m => ({ ...m, [i]: now }));
    } catch {
      setMessage(tr('Could not look up "{name}" just now. You can type its numbers.', { name: now }));
    } finally { setFixing(null); }
  };

  const add = () => {
    if (!items?.length) return;
    update(d => {
      for (const it of items) d.meals.push({
        name: it.name, grams: it.grams, kcal: it.kcal, p: it.protein_g, c: it.carbs_g, f: it.fat_g, fib: it.fibre_g ?? 0,
        source: source === 'words' ? (it.basis === 'IFCT' ? 'words+ifct' : 'words') : (it.basis === 'IFCT' ? 'photo+ifct' : 'photo'),
      });
    });
    setMessage(`Added ${items.length} item${items.length > 1 ? 's' : ''} to your day.`);
    setItems(null); setUri(null); setInsight(''); setWords(''); setMode(null);
  };

  return (
    <Card>
      <Heading right={right}>{tr('Food')}</Heading>
      {top}
      {(
        <>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {([['photo', 'camera-outline', tr('Photo')], ['speak', 'mic-outline', tr('Speak')], ['type', 'create-outline', tr('Type')]] as const).map(([m, icon, label]) => (
              <Pressable key={m} accessibilityRole="button" accessibilityLabel={`${label} your meal`} disabled={busy}
                onPress={() => {
                  setMode(m); setMessage(null);
                  if (!session && m !== 'type') { setMessage(tr('Sign in to use Photo and Speak. Type works now.')); return; }
                  if (m === 'photo') pick(Platform.OS !== 'web');
                  if (m === 'speak' && Speech && !listening) speak();
                }}
                style={({ pressed }) => ({
                  flex: 1, alignItems: 'center', gap: 6, paddingVertical: 16, borderRadius: 16, borderWidth: 1,
                  borderColor: mode === m ? colors.accent : colors.line, backgroundColor: mode === m ? colors.accent + '14' : colors.surface,
                  opacity: pressed || busy ? 0.7 : 1,
                })}>
                <Ionicons name={icon} size={28} color={mode === m ? colors.accent : colors.ink} />
                <Text style={{ fontWeight: '600', color: colors.ink }}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {mode === 'speak' && (Speech ? (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16, color: colors.ink }}>{listening ? tr('Listening… say what you ate') : words ? `"${words}"` : tr('Tap Speak to try again.')}</Text>
              {listening ? <Button kind="plain" title={tr('Done')} onPress={finishListening} /> : null}
            </View>
          ) : (
            <Note>{tr('Speaking is coming with the Happy Orange iPhone app very soon. For now, tap Photo or Type.')}</Note>
          ))}

          {mode === 'type' && (!session || noAi) && (
            <IfctPicker start={firstFood(words)} why={!session ? tr('Search a food and add grams. Sign in to just type your whole meal in your own words.') : noAi ?? undefined} />
          )}

          {mode === 'type' && session && !noAi && (
            <>
              <TextField label={tr('What did you eat?')} value={words} onChangeText={setWords} multiline
                placeholder={tr('e.g. 2 rotis with ghee, 1 katori moong dal, bhindi sabzi, a cup of chai with sugar')} />
              <Button kind="insight" title={busy ? tr('Calculating…') : tr('Calculate')} onPress={() => describe()} disabled={busy || !words.trim()} />
            </>
          )}

        </>
      )}
      {uri ? <Image source={{ uri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 10, backgroundColor: colors.sunk }} resizeMode="cover" /> : null}
      {message ? <Text style={{ color: colors.muted }}>{message}</Text> : null}
      {insight ? <Text style={{ color: colors.insight, fontWeight: '600' }}>{oneLine(insight)}</Text> : null}
      {items?.map((it, i) => (
        <View key={`${i}-${items.length}`} style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
          <View style={[s.headingRow]}>
            <TextInput style={[s.input, { flex: 1 }]} value={it.name} onChangeText={v => { if (named[i] == null) setNamed(m => ({ ...m, [i]: it.name })); edit(i, 'name', v); }}
              onEndEditing={() => renamed(i)} onSubmitEditing={() => renamed(i)} returnKeyType="done" />
            <Text style={{ color: it.basis === 'IFCT' ? colors.body : colors.muted, fontSize: 12, fontWeight: '700' }}>{it.basis === 'IFCT' ? 'IFCT' : 'ESTIMATE'}</Text>
            <Pressable onPress={() => remove(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel={tr('Remove {name}', { name: it.name })}
              style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
          </View>
          {fixing === i ? <Text style={{ color: colors.insight, fontSize: 13 }}>{tr('Myra is looking up {name}…', { name: it.name })}</Text> : null}
          <View style={s.row}>
            {([['grams', 'g'], ['kcal', 'kcal'], ['protein_g', tr('Protein g')], ['carbs_g', tr('Carbs g')], ['fat_g', tr('Fat g')], ['fibre_g', tr('Fibre g')]] as const).map(([k, label]) => (
              <View key={`${k}-${it[k]}`} style={{ width: 84, gap: 2 }}>
                <Text style={s.fieldLabel}>{label}</Text>
                <TextInput style={s.input} keyboardType="decimal-pad" defaultValue={String(it[k] ?? 0)} onEndEditing={e => edit(i, k, e.nativeEvent.text)} />
              </View>
            ))}
          </View>
        </View>
      ))}
      {note && items?.length ? <Note>{note}</Note> : null}
      {items?.length ? (
        <View style={s.row}>
          <Button title={tr('Add to my day')} onPress={add} disabled={fixing != null} />
          <Button kind="plain" title={tr('Discard')} onPress={() => { setItems(null); setUri(null); setMessage(null); setInsight(''); }} />
        </View>
      ) : null}
      {children}
    </Card>
  );
}

/** True when the AI itself can't be used (no key, out of credit, a limit, offline); other errors are worth a retry. */
function aiUnavailable(e: unknown) {
  const m = e instanceof Error ? e.message : '';
  return /key|credit|billing|limit|quota|sign in|online version|reach the AI/i.test(m);
}

/** The first food in a typed meal, for the IFCT search box: "1 aloo paratha, 1 roti…" → "aloo paratha". */
export function firstFood(words: string) {
  const first = words.split(/,|\band\b|\n|\+|&/i)[0] ?? '';
  return first.replace(/^\s*(\d+([.\/]\d+)?|a|an|one|two|half)\s*(bowls?|katoris?|cups?|glass(es)?|plates?|pieces?|pcs|g|gm|grams?|tbsp|tsp|spoons?)?\s*(of\s+)?/i, '').trim();
}
