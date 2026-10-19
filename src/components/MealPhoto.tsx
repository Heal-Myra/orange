// Log a meal by describing it (typed or spoken) or with a photo → calories, protein, carbs and fat.
// Numbers come from IFCT 2017 where an ingredient matches.
// The person checks and edits every number before it is added (understanding over tracking).

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { analyseMeal, analyseMealText, oneLine, type MealItem } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Heading, Note, TextField, s } from './ui';

export async function shrink(uri: string, fallback: string | null | undefined, mime: string | null | undefined) {
  try {
    const ctx = ImageManipulator.ImageManipulator.manipulate(uri);
    ctx.resize({ width: 1024, height: null });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, base64: true, compress: 0.8 });
    if (out.base64) return { data: out.base64, type: 'image/jpeg' };
  } catch { /* fall back to the picker's own copy */ }
  if (fallback) return { data: fallback, type: mime ?? 'image/jpeg' };
  throw new Error('Could not read that photo. Try another one.');
}

/**
 * Speech to text in the browser, where it works reliably (Chrome, Android).
 * Not offered on iPhone/iPad: Safari's speech recognition often hangs, especially in home-screen apps,
 * and the keyboard's own microphone (dictation) works better there.
 */
function speechRecognition(): (new () => any) | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof navigator === 'undefined') return null;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => any) | null;
}

export function MealPhoto() {
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

  const pick = async (camera: boolean) => {
    setMessage(null); setItems(null);
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, base64: true };
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setMessage('Camera permission is needed to photograph a meal. You can choose a photo instead.'); return; }
    }
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled) return;
    const a = res.assets[0];
    setUri(a.uri); setSource('photo');
    setBusy(true); setMessage('Reading your plate…');
    try {
      const img = await shrink(a.uri, a.base64, a.mimeType);
      const r = await analyseMeal(img.data, img.type, hint);
      setItems(r.items);
      setInsight(r.insight);
      setNote([r.confidence && `Confidence: ${r.confidence}.`, r.note].filter(Boolean).join(' '));
      setMessage(r.items.length ? 'Check the numbers, change anything that looks off, then add.' : (r.note || 'No food found in the photo.'));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally { setBusy(false); }
  };

  const describe = async (said?: string) => {
    const text = (said ?? words).trim();
    if (!text) return;
    setMessage('Calculating your meal…'); setItems(null); setBusy(true); setSource('words'); setUri(null);
    try {
      const r = await analyseMealText(text);
      setItems(r.items);
      setInsight(r.insight);
      setNote([r.confidence && `Confidence: ${r.confidence}.`, r.note].filter(Boolean).join(' '));
      setMessage(r.items.length ? 'Check the numbers, change anything that looks off, then add.' : (r.note || 'No food found in that description.'));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally { setBusy(false); }
  };

  const Speech = speechRecognition();
  const stopListening = () => {
    try { rec.current?.abort?.(); } catch { /* already stopped */ }
    rec.current = null; setListening(false);
  };
  const speak = () => {
    if (!Speech) return;
    if (listening) { stopListening(); return; }
    let r: any;
    try { r = new Speech(); } catch { setMessage('Speaking is not available here. Tap the microphone on your keyboard instead.'); return; }
    r.lang = 'en-IN'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e: any) => { const t = e.results?.[0]?.[0]?.transcript ?? ''; if (t) { setWords(t); describe(t); } };
    r.onerror = () => { setMessage('Could not hear that. You can also tap the microphone on your keyboard.'); stopListening(); };
    r.onend = () => setListening(false);
    rec.current = r; setListening(true);
    try { r.start(); } catch { stopListening(); setMessage('Speaking is not available here. Tap the microphone on your keyboard instead.'); return; }
    // Never stay stuck: stop listening after 15 seconds whatever happens.
    setTimeout(() => { if (rec.current === r) stopListening(); }, 15_000);
  };

  const edit = (i: number, key: keyof MealItem, value: string) => setItems(list => list && list.map((it, n) => n !== i ? it : {
    ...it, [key]: key === 'name' ? value : (parseFloat(value) || 0),
  }));

  const add = () => {
    if (!items?.length) return;
    update(d => {
      for (const it of items) d.meals.push({
        name: it.name, grams: it.grams, kcal: it.kcal, p: it.protein_g, c: it.carbs_g, f: it.fat_g,
        source: source === 'words' ? (it.basis === 'IFCT' ? 'words+ifct' : 'words') : (it.basis === 'IFCT' ? 'photo+ifct' : 'photo'),
      });
    });
    setMessage(`Added ${items.length} item${items.length > 1 ? 's' : ''} to your day.`);
    setItems(null); setUri(null); setInsight(''); setWords(''); setMode(null);
  };

  return (
    <Card>
      <Heading>Log a meal</Heading>
      {!session ? <Note>Sign in to log meals this way.</Note> : (
        <>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {([['photo', 'camera-outline', 'Photo'], ['speak', 'mic-outline', 'Speak'], ['type', 'create-outline', 'Type']] as const).map(([m, icon, label]) => (
              <Pressable key={m} accessibilityRole="button" accessibilityLabel={`${label} your meal`} disabled={busy}
                onPress={() => {
                  setMode(m); setMessage(null);
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
              <Text style={{ fontSize: 16, color: colors.ink }}>{listening ? 'Listening… say what you ate' : words ? `"${words}"` : 'Tap Speak to try again.'}</Text>
              {listening ? <Button kind="plain" title="Stop" onPress={stopListening} /> : null}
            </View>
          ) : (
            <Note>Speaking is coming with the Happy Orange iPhone app very soon. For now, tap Photo or Type.</Note>
          ))}

          {mode === 'type' && (
            <>
              <TextField label="What did you eat?" value={words} onChangeText={setWords} multiline
                placeholder="e.g. 2 rotis with ghee, 1 katori moong dal, bhindi sabzi, a cup of chai with sugar" />
              <Button kind="insight" title={busy ? 'Calculating…' : 'Calculate'} onPress={() => describe()} disabled={busy || !words.trim()} />
            </>
          )}

          {!mode && <Note>Numbers come from IFCT 2017 wherever an ingredient matches. You can check and change everything before adding.</Note>}
        </>
      )}
      {uri ? <Image source={{ uri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 10, backgroundColor: colors.sunk }} resizeMode="cover" /> : null}
      {message ? <Text style={{ color: colors.muted }}>{message}</Text> : null}
      {insight ? <Text style={{ color: colors.insight, fontWeight: '600' }}>{oneLine(insight)}</Text> : null}
      {items?.map((it, i) => (
        <View key={i} style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
          <View style={[s.headingRow]}>
            <TextInput style={[s.input, { flex: 1 }]} value={it.name} onChangeText={v => edit(i, 'name', v)} />
            <Text style={{ color: it.basis === 'IFCT' ? colors.body : colors.muted, fontSize: 12, fontWeight: '700' }}>{it.basis === 'IFCT' ? 'IFCT' : 'ESTIMATE'}</Text>
          </View>
          <View style={s.row}>
            {([['grams', 'g'], ['kcal', 'kcal'], ['protein_g', 'Protein g'], ['carbs_g', 'Carbs g'], ['fat_g', 'Fat g']] as const).map(([k, label]) => (
              <View key={k} style={{ width: 84, gap: 2 }}>
                <Text style={s.fieldLabel}>{label}</Text>
                <TextInput style={s.input} keyboardType="decimal-pad" defaultValue={String(it[k])} onEndEditing={e => edit(i, k, e.nativeEvent.text)} />
              </View>
            ))}
          </View>
        </View>
      ))}
      {note && items?.length ? <Note>{note}</Note> : null}
      {items?.length ? (
        <View style={s.row}>
          <Button title="Add to my day" onPress={add} />
          <Button kind="plain" title="Discard" onPress={() => { setItems(null); setUri(null); setMessage(null); setInsight(''); }} />
        </View>
      ) : null}
    </Card>
  );
}
