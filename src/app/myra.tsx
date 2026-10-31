// Myra: the assistant. Helps people find their way around the app, explains scores and looks at their own data.
// Uses the heal-ai server function (needs sign-in; counts towards the daily AI cap).
// 21 Oct 2026 (founder): the typing box stays above the keyboard, a photo or document (PDF, text) can be attached,
// and there is a Speak button.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, Platform, Pressable, ScrollView, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { shrink, speechRecognition } from '../components/MealPhoto';
import { Button, Note, s } from '../components/ui';
import { askMyra, type AttachmentData, type ChatAttachment, type ChatMessage } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { buildContext } from '../lib/context';
import { useHeal } from '../lib/store';
import { todayISO } from '../lib/dates';
import { tasksForAI, useTasks } from '../lib/tasks';
import { colors } from '../theme';
import { lang, tr } from '../lib/i18n';
import { optional } from '../lib/native';
import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

// The document picker arrived with a later app build; older installed builds simply don't offer documents.
let DocumentPicker: typeof import('expo-document-picker') | null = null;
DocumentPicker = optional(['ExpoDocumentPicker'], () => require('expo-document-picker'));

const KEY = 'heal.myra';
const MAX_FILE_MB = 4;
const HELLO: ChatMessage = { role: 'myra', text: "Hello, I'm Myra. I can help you find your way around Happy Orange, explain your scores, or look at how your week is going. What would you like?" };

const SUGGESTIONS: Record<string, string[]> = {
  today: ['How is my week going?', 'Why is my score what it is?', 'What is one thing I can improve today?'],
  body: ['How do I add a meal?', 'Is my protein enough today?', 'What should I eat for dinner?'],
  mind: ['How does the Mind score work?', 'Explain today\'s Tao practice', 'How can I cut mindless scrolling?'],
  soul: ['Explain today\'s verse simply', 'How do I add a reflection?', 'How does the Soul score work?'],
  library: ['What is in the Library?', 'Which foods are high in iron?', 'Suggest a simple home exercise'],
};

/** Reads a picked file as base64 (works for file:// on the phone and blob: on the web). */
async function base64Of(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(blob);
  });
}

export default function Myra() {
  // q: a question typed in Today's Myra card, sent at once; listen: start speaking at once (31 Oct 2026).
  const { from, q, listen } = useLocalSearchParams<{ from?: string; q?: string; listen?: string }>();
  const [loaded, setLoaded] = useState(false);
  const askedRef = useRef(false);
  const speakRef = useRef<(() => void) | null>(null);
  const page = typeof from === 'string' && SUGGESTIONS[from] ? from : 'today';
  const { session, tradition } = useAuth();
  const { day, days, date, profile } = useHeal();
  const { open } = useTasks();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([HELLO]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<(AttachmentData & { uri?: string }) | null>(null);
  const [menu, setMenu] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [kb, setKb] = useState(0);
  const scroll = useRef<ScrollViewInstance>(null);
  const rec = useRef<any>(null);
  const Speech = speechRecognition();

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => { if (v) setMessages(JSON.parse(v)); }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  // Keep the typing box above the keyboard. iPhone: lift by the keyboard's height (this screen is a sheet that reaches
  // the bottom of the screen); Android resizes the window by itself.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', e => { setKb(e.endCoordinates.height); setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50); });
    const hide = Keyboard.addListener('keyboardWillHide', () => setKb(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const save = (m: ChatMessage[]) => AsyncStorage.setItem(KEY, JSON.stringify(m.slice(-40))).catch(() => {});

  const send = async (q: string) => {
    const question = q.trim() || (file ? tr('Please look at this.') : '');
    if (!question || busy) return;
    const attach: ChatAttachment | undefined = file ? { kind: file.kind, name: file.name, uri: file.kind === 'image' ? file.uri : undefined } : undefined;
    const next: ChatMessage[] = [...messages, { role: 'user', text: question, attach }];
    const sending = file;
    setMessages(next); setText(''); setFile(null); setMenu(false); setNote(null); setBusy(true);
    try {
      const r = await askMyra(next.filter(m => m !== HELLO), buildContext(day, days, date, profile, tasksForAI(open, todayISO()), tradition), page,
        sending ? { kind: sending.kind, name: sending.name, media_type: sending.media_type, data: sending.data, text: sending.text } : undefined);
      const done: ChatMessage[] = [...next, { role: 'myra', text: r.text }];
      setMessages(done); save(done);
      // Feedback told to Myra goes to the team (founder, 31 Oct 2026): Admin › Feedback, area "Myra chat".
      if (r.feedback && supabase && session) {
        supabase.from('feedback').insert({ email: session.user.email, area: 'Myra chat', rating: null, message: r.feedback,
          app_version: Constants.expoConfig?.version ?? 'web' }).then(() => {}, () => {});
      }
    } catch (e) {
      setMessages([...next, { role: 'myra', text: e instanceof Error ? e.message : tr('Something went wrong. Please try again.') }]);
    } finally { setBusy(false); }
  };

  const pickPhoto = async (camera: boolean) => {
    setMenu(false); setNote(null);
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setNote(tr('Camera permission is needed. You can choose a photo instead.')); return; }
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, base64: true };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled) return;
    const a = res.assets[0];
    try {
      const img = await shrink(a.uri, a.base64, a.mimeType);
      setFile({ kind: 'image', name: a.fileName ?? tr('Photo'), media_type: img.type, data: img.data, uri: a.uri });
    } catch (e) { setNote(e instanceof Error ? e.message : tr('Could not read that photo. Try another one.')); }
  };

  const pickDocument = async () => {
    setMenu(false); setNote(null);
    if (!DocumentPicker) { setNote(tr('Documents come with the next app update. Photos work now.')); return; }
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'text/plain', 'text/csv', 'application/json'], copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets?.length) return;
    const d = res.assets[0];
    if ((d.size ?? 0) > MAX_FILE_MB * 1024 * 1024) { setNote(tr('That file is too big. Please choose one under {mb} MB.', { mb: MAX_FILE_MB })); return; }
    const mime = d.mimeType ?? (d.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'text/plain');
    try {
      if (mime === 'application/pdf') setFile({ kind: 'pdf', name: d.name, media_type: mime, data: await base64Of(d.uri) });
      else setFile({ kind: 'text', name: d.name, text: (await (await fetch(d.uri)).text()).slice(0, 20000) });
    } catch { setNote(tr('Could not read that file. Try a PDF or a photo.')); }
  };

  useEffect(() => {
    if (!loaded || askedRef.current || !session) return;
    if (typeof q === 'string' && q.trim()) { askedRef.current = true; send(q); }
    else if (listen === '1') { askedRef.current = true; setTimeout(() => speakRef.current?.(), 300); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, q, listen, session]);
  const stopListening = () => { try { rec.current?.abort?.(); } catch { /* stopped */ } rec.current = null; setListening(false); };
  const speak = () => {
    if (!Speech) { setNote(tr('Tap the microphone on your keyboard to speak.')); return; }
    if (listening) { const r = rec.current; if (r?.stop) { try { r.stop(); return; } catch { /* fall through */ } } stopListening(); return; }
    let r: any;
    try { r = new Speech(); } catch { setNote(tr('Tap the microphone on your keyboard to speak.')); return; }
    r.lang = lang() === 'hi' ? 'hi-IN' : 'en-IN'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e: any) => { const t = e.results?.[0]?.[0]?.transcript ?? ''; if (t) setText(x => (x ? `${x} ${t}` : t)); };
    r.onerror = (problem?: string) => {
      setNote(problem === 'permission' ? tr('Allow the microphone: Settings → Happy Orange → Microphone and Speech Recognition.')
        : problem === 'dictation-off' ? tr('Turn on Dictation: Settings → General → Keyboard → Enable Dictation.')
        : tr('Could not hear that. You can also tap the microphone on your keyboard.'));
      stopListening();
    };
    r.onend = () => setListening(false);
    rec.current = r; setListening(true); setNote(null);
    try { r.start(); } catch { stopListening(); setNote(tr('Tap the microphone on your keyboard to speak.')); return; }
    setTimeout(() => { if (rec.current === r) { if (r.stop) { try { r.stop(); } catch { stopListening(); } } else stopListening(); } }, 20_000);
  };
  speakRef.current = speak;

  const clear = () => { setMessages([HELLO]); AsyncStorage.removeItem(KEY).catch(() => {}); };

  const iconBtn = (name: React.ComponentProps<typeof Ionicons>['name'], label: string, onPress: () => void, on = false) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} disabled={busy}
      style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
        backgroundColor: on ? colors.insight : colors.field, borderWidth: 1, borderColor: on ? colors.insight : colors.line }}>
      <Ionicons name={name} size={22} color={on ? colors.onInsight : colors.ink} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[s.safe]} edges={['bottom']}>
      <View style={{ flex: 1, paddingBottom: kb ? Math.max(0, kb - insets.bottom) : 0 }}>
        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 10 }}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
          {messages.map((m, i) => (
            <View key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '86%', padding: 12, borderRadius: 16, gap: 8,
              backgroundColor: m.role === 'user' ? colors.accent : colors.surface, borderWidth: m.role === 'user' ? 0 : 1, borderColor: colors.line,
            }}>
              {m.attach?.uri ? <Image source={{ uri: m.attach.uri }} style={{ width: 180, height: 135, borderRadius: 10 }} resizeMode="cover" /> : null}
              {m.attach && !m.attach.uri ? (
                <Text style={{ color: m.role === 'user' ? colors.onAccent : colors.ink, fontSize: 13 }}>📎 {m.attach.name}</Text>
              ) : null}
              <Text selectable style={{ color: m.role === 'user' ? colors.onAccent : colors.ink, fontSize: 15, lineHeight: 22 }}>{m.text}</Text>
            </View>
          ))}
          {busy ? <Note>{tr('Myra is thinking…')}</Note> : null}
          {session && messages.length <= 2 && !busy && (
            <View style={{ gap: 8, paddingTop: 4 }}>
              {SUGGESTIONS[page].map(q => (
                <Pressable key={q} onPress={() => send(tr(q))} style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: colors.insight, backgroundColor: colors.surface }}>
                  <Text style={{ color: colors.insight, fontWeight: '600' }}>{tr(q)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={{ padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg }}>
          {session ? (
            <>
              {menu ? (
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {Platform.OS !== 'web' ? <Button kind="plain" title={tr('Camera')} onPress={() => pickPhoto(true)} /> : null}
                  <Button kind="plain" title={tr('Photo')} onPress={() => pickPhoto(false)} />
                  <Button kind="plain" title={tr('Document')} onPress={pickDocument} />
                </View>
              ) : null}
              {file ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 12, backgroundColor: colors.tint }}>
                  {file.uri ? <Image source={{ uri: file.uri }} style={{ width: 40, height: 40, borderRadius: 6 }} /> : <Ionicons name="document-text-outline" size={24} color={colors.accent} />}
                  <Text numberOfLines={1} style={{ flex: 1, color: colors.ink }}>{file.name}</Text>
                  <Pressable onPress={() => setFile(null)} hitSlop={8} accessibilityLabel={tr('Remove')}><Ionicons name="close" size={20} color={colors.muted} /></Pressable>
                </View>
              ) : null}
              {listening ? <Text style={{ color: colors.insight, fontWeight: '600' }}>{tr('Listening… tap the microphone again when you finish.')}</Text> : null}
              {note ? <Text style={{ color: colors.muted }}>{note}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                {iconBtn('add', tr('Attach a photo or document'), () => setMenu(x => !x), menu)}
                <TextInput style={[s.input, { flex: 1, maxHeight: 120 }]} value={text} onChangeText={setText} placeholder={tr('Ask Myra anything…')}
                  placeholderTextColor={colors.muted} multiline onFocus={() => setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 300)} />
                {iconBtn(listening ? 'stop' : 'mic-outline', tr('Speak'), speak, listening)}
                <Button kind="insight" title={tr('Send')} onPress={() => send(text)} disabled={(!text.trim() && !file) || busy} />
              </View>
              {!kb ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Note>{tr('Myra can make mistakes. Not medical advice.')}</Note>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <Pressable onPress={() => router.push({ pathname: '/feedback', params: { from: page } })}>
                      <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 13 }}>{tr('Feedback')}</Text>
                    </Pressable>
                    {messages.length > 1 ? <Pressable onPress={clear}><Text style={{ color: colors.accent, fontWeight: '600', fontSize: 13 }}>{tr('Clear chat')}</Text></Pressable> : null}
                  </View>
                </View>
              ) : null}
            </>
          ) : <Note>{tr('Sign in to talk to Myra (Profile, top right of Today → Sign in).')}</Note>}
        </View>
      </View>
    </SafeAreaView>
  );
}
