// Meal photo → calories, protein, carbs and fat. Numbers come from IFCT 2017 where an ingredient matches.
// The person checks and edits every number before it is added (understanding over tracking).

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Platform, Text, TextInput, View } from 'react-native';
import { analyseMeal, type MealItem } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Heading, Note, TextField, s } from './ui';

async function shrink(uri: string, fallback: string | null | undefined, mime: string | null | undefined) {
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

export function MealPhoto() {
  const { session } = useAuth();
  const { update } = useHeal();
  const [uri, setUri] = useState<string | null>(null);
  const [hint, setHint] = useState('');
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
    setUri(a.uri);
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

  const edit = (i: number, key: keyof MealItem, value: string) => setItems(list => list && list.map((it, n) => n !== i ? it : {
    ...it, [key]: key === 'name' ? value : (parseFloat(value) || 0),
  }));

  const add = () => {
    if (!items?.length) return;
    update(d => {
      for (const it of items) d.meals.push({
        name: it.name, grams: it.grams, kcal: it.kcal, p: it.protein_g, c: it.carbs_g, f: it.fat_g,
        source: it.basis === 'IFCT' ? 'photo+ifct' : 'photo',
      });
    });
    setMessage(`Added ${items.length} item${items.length > 1 ? 's' : ''} to your day.`);
    setItems(null); setUri(null); setHint(''); setInsight('');
  };

  return (
    <Card>
      <Heading>Snap a meal</Heading>
      <Note>Take or choose a photo. The AI names each dish and its ingredients; the numbers come from IFCT 2017 wherever an ingredient matches.</Note>
      {!session ? <Note>Sign in to use meal photos.</Note> : (
        <>
          <TextField label="Anything the photo won't show? (optional)" value={hint} onChangeText={setHint}
            placeholder="e.g. 2 rotis with ghee, moong dal, chai with sugar" />
          <View style={s.row}>
            {Platform.OS !== 'web' && <Button title="Take photo" onPress={() => pick(true)} disabled={busy} />}
            <Button kind={Platform.OS === 'web' ? 'primary' : 'plain'} title={Platform.OS === 'web' ? 'Take or choose photo' : 'Choose photo'} onPress={() => pick(false)} disabled={busy} />
          </View>
        </>
      )}
      {uri ? <Image source={{ uri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 10, backgroundColor: colors.sunk }} resizeMode="cover" /> : null}
      {message ? <Text style={{ color: colors.muted }}>{message}</Text> : null}
      {insight ? <Text style={{ color: colors.ink, borderLeftWidth: 3, borderLeftColor: colors.body, paddingLeft: 10 }}>{insight}</Text> : null}
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
