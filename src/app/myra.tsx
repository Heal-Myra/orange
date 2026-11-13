// Myra: the assistant. Helps people find their way around the app, explains scores and looks at their own data.
// Uses the heal-ai server function (needs sign-in; counts towards the daily AI cap).
// 21 Oct 2026 (founder): the typing box stays above the keyboard, a photo or document (PDF, text) can be attached,
// and there is a Speak button.
// 13 Nov 2026 (founder: "make Myra like Claude"): a quiet opening with a greeting, ☰ past chats, 👻 private chat (not
// saved, not learned from), ✎ new chat, a rounded bar with ＋ · "Type or hold to talk" · 🎙 · voice mode (Send when
// typing), and ＋ opening Camera · Photos · Files plus Myra's shortcuts.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { MyraVoice } from '../components/MyraVoice';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { shrink, speechRecognition } from '../components/MealPhoto';
import { Button, Note, s } from '../components/ui';
import { askMyra, type AttachmentData, type ChatAttachment, type ChatMessage } from '../lib/ai';
import { useSmartUpload } from '../lib/smartUpload';
import { useRotatingHint } from '../lib/rotatingHint';
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

const KEY = 'heal.myra'; // the old single chat, moved into the chat list once
const CHATS = 'heal.myra.chats';
interface Chat { id: string; at: string; title: string; messages: ChatMessage[] }
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
/** The opening line, by the time of day (founder, 13 Nov 2026: like Claude's "What's cooking?"). */
const greeting = (name?: string) => {
  const h = new Date().getHours(), n = name?.split(' ')[0];
  const line = h < 5 ? 'Up late{n}?' : h < 11 ? 'Good morning{n}' : h < 15 ? "What's on your plate{n}?" : h < 19 ? 'How is the day going{n}?' : 'Winding down{n}?';
  return tr(line, { n: n ? `, ${n}` : '' });
};
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
  const { from, q, listen, attach } = useLocalSearchParams<{ from?: string; q?: string; listen?: string; attach?: string }>();
  const [loaded, setLoaded] = useState(false);
  const askedRef = useRef(false);
  const speakRef = useRef<(() => void) | null>(null);
  const page = typeof from === 'string' && SUGGESTIONS[from] ? from : 'today';
  const { session, tradition } = useAuth();
  const { day, days, date, profile, setProfile } = useHeal();
  const { open } = useTasks();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatId, setChatId] = useState(newId);
  const [privateChat, setPrivateChat] = useState(false);
  const [history, setHistory] = useState(false);
  const [voice, setVoice] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<(AttachmentData & { uri?: string }) | null>(null);
  const [menu, setMenu] = useState(attach === '1'); // + on Today's Myra card opens the attach choices
  const [note, setNote] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [kb, setKb] = useState(0);
  const scroll = useRef<ScrollViewInstance>(null);
  const rec = useRef<any>(null);
  const Speech = speechRecognition();
  const upload = useSmartUpload();
  const hint = useRotatingHint(!!text || !!file);

  useEffect(() => {
    (async () => {
      let list: Chat[] = JSON.parse((await AsyncStorage.getItem(CHATS).catch(() => null)) ?? '[]');
      // The single chat from before 13 Nov 2026 becomes the first chat in the list.
      const old = await AsyncStorage.getItem(KEY).catch(() => null);
      if (old) {
        const m = (JSON.parse(old) as ChatMessage[]).filter(x => x.text !== HELLO.text);
        if (m.length) list = [{ id: newId(), at: new Date().toISOString(), title: m.find(x => x.role === 'user')?.text.slice(0, 60) ?? 'Myra', messages: m }, ...list];
        AsyncStorage.removeItem(KEY).catch(() => {});
        AsyncStorage.setItem(CHATS, JSON.stringify(list)).catch(() => {});
      }
      setChats(list);
    })().catch(() => {}).finally(() => setLoaded(true));
  }, []);

  // Keep the typing box above the keyboard. iPhone: lift by the keyboard's height (this screen is a sheet that reaches
  // the bottom of the screen); Android resizes the window by itself.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', e => { setKb(e.endCoordinates.height); setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50); });
    const hide = Keyboard.addListener('keyboardWillHide', () => setKb(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Each chat is kept (the last 40 messages, the latest 30 chats); a private chat is never saved.
  const save = (m: ChatMessage[]) => {
    if (privateChat || !m.length) return;
    setChats(list => {
      const title = m.find(x => x.role === 'user')?.text.slice(0, 60) ?? 'Myra';
      const next = [{ id: chatId, at: new Date().toISOString(), title, messages: m.slice(-40) }, ...list.filter(c => c.id !== chatId)].slice(0, 30);
      AsyncStorage.setItem(CHATS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };
  const startNew = (priv = false) => { setMessages([]); setChatId(newId()); setPrivateChat(priv); setFile(null); setText(''); setNote(null); setHistory(false); };
  const openChat = (c: Chat) => { setMessages(c.messages); setChatId(c.id); setPrivateChat(false); setHistory(false); };
  const removeChat = (id: string) => setChats(list => { const next = list.filter(c => c.id !== id); AsyncStorage.setItem(CHATS, JSON.stringify(next)).catch(() => {}); if (id === chatId) startNew(); return next; });

  const send = async (q: string): Promise<string> => {
    const question = q.trim() || (file ? tr('Please look at this.') : '');
    if (!question || busy) return '';
    const attach: ChatAttachment | undefined = file ? { kind: file.kind, name: file.name, uri: file.kind === 'image' ? file.uri : undefined } : undefined;
    const next: ChatMessage[] = [...messages, { role: 'user', text: question, attach }];
    const sending = file;
    setMessages(next); setText(''); setFile(null); setMenu(false); setNote(null); setBusy(true);
    // A picture: Myra first sees whether a card takes it (meal, Screen Time, to-dos, journal, selfie) and offers to add
    // it (founder, 1 Nov 2026; decision 0046). Otherwise she talks about it as before.
    if (sending?.kind === 'image' && sending.data && sending.media_type) {
      try {
        const offer = await upload.read({ data: sending.data, media_type: sending.media_type }, q.trim());
        if (offer) {
          const done: ChatMessage[] = [...next, { role: 'myra', text: tr('Here is what I found. Shall I add it?'), offer }];
          setMessages(done); save(done); setBusy(false);
          return done[done.length - 1].text;
        }
      } catch (e) {
        // No answer from the AI at all: say so now rather than wait another minute for the chat reply (tester, 9 Nov 2026).
        if (e instanceof Error && e.name === 'AiUnreachable') {
          const done: ChatMessage[] = [...next, { role: 'myra', text: e.message }];
          setMessages(done); save(done); setBusy(false);
          return e.message;
        }
        /* otherwise fall back to talking about it */
      }
    }
    try {
      const r = await askMyra(next, buildContext(day, days, date, profile, tasksForAI(open, todayISO()), tradition), page,
        sending ? { kind: sending.kind, name: sending.name, media_type: sending.media_type, data: sending.data, text: sending.text } : undefined, profile.me?.style);
      const done: ChatMessage[] = [...next, { role: 'myra', text: r.text }];
      setMessages(done); save(done);
      // What Myra has learned about how the person talks (founder, 10 Nov 2026), kept with About you so it syncs.
      if (!privateChat && r.style && profile.me && r.style !== profile.me.style) setProfile({ ...profile, me: { ...profile.me, style: r.style } });
      // Feedback told to Myra goes to the team (founder, 31 Oct 2026): Admin › Feedback, area "Myra chat".
      if (r.feedback && supabase && session) {
        supabase.from('feedback').insert({ email: session.user.email, area: 'Myra chat', rating: null, message: r.feedback,
          app_version: Constants.expoConfig?.version ?? 'web' }).then(() => {}, () => {});
      }
      return r.text;
    } catch (e) {
      const t = e instanceof Error ? e.message : tr('Something went wrong. Please try again.');
      setMessages([...next, { role: 'myra', text: t }]);
      return t;
    } finally { setBusy(false); }
  };

  // "Add to my day" or "No" on an offer.
  const decide = (i: number, yes: boolean) => {
    const m = messages[i];
    if (!m?.offer || m.offer.state) return;
    const said = yes ? upload.apply(m.offer) : tr('Okay, I left it out.');
    const done: ChatMessage[] = [...messages.slice(0, i), { ...m, offer: { ...m.offer, state: yes ? 'added' : 'no' } }, ...messages.slice(i + 1), { role: 'myra', text: said }];
    setMessages(done); save(done);
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


  const round = (name: React.ComponentProps<typeof Ionicons>['name'], label: string, onPress: () => void, bg: string = colors.field, fg: string = colors.ink, onLongPress?: () => void, onPressOut?: () => void) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} onLongPress={onLongPress} onPressOut={onPressOut} hitSlop={6} disabled={busy && name !== 'stop'}
      style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
      <Ionicons name={name} size={21} color={fg} />
    </Pressable>
  );
  const topBtn = (name: React.ComponentProps<typeof Ionicons>['name'], label: string, onPress: () => void, on = false) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8}
      style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.ink : colors.surface,
        shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
      <Ionicons name={name} size={21} color={on ? '#fff' : colors.ink} />
    </Pressable>
  );
  const empty = messages.length === 0;
  const typing = !!text.trim() || !!file;
  // Hold the microphone to talk, let go to stop (founder: "Type or hold to talk", like Claude).
  const holding = useRef(false);
  const plus = (label: string, icon: React.ComponentProps<typeof Ionicons>['name'], onPress: () => void) => (
    <Pressable key={label} onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Ionicons name={icon} size={20} color={colors.ink} /><Text style={{ color: colors.ink, fontSize: 15.5 }}>{label}</Text>
    </Pressable>
  );
  const tile = (label: string, icon: React.ComponentProps<typeof Ionicons>['name'], onPress: () => void) => (
    <Pressable key={label} onPress={onPress} accessibilityRole="button" style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.bg }}>
      <Ionicons name={icon} size={24} color={colors.ink} /><Text style={{ color: colors.ink, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
  const goBody = () => { setMenu(false); router.back(); setTimeout(() => router.navigate({ pathname: '/body', params: { snap: String(Date.now()) } }), 50); };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, paddingBottom: kb ? Math.max(0, kb - insets.bottom) : 0 }}>
        {/* Top: ☰ past chats · title · 👻 private chat (empty) or ✎ new chat */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 4 }}>
          {topBtn('menu-outline', tr('Past chats'), () => setHistory(true))}
          <View style={{ flex: 1, alignItems: 'center' }}>
            {!empty ? <Text style={{ color: colors.ink, fontWeight: '600', fontSize: 16 }}>{privateChat ? tr('Private chat') : tr('Myra')}</Text> : null}
          </View>
          {empty ? topBtn('eye-off-outline', privateChat ? tr('Private chat is on') : tr('Private chat'), () => setPrivateChat(p => !p), privateChat)
            : topBtn('create-outline', tr('New chat'), () => startNew())}
        </View>

        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          onContentSizeChange={() => !empty && scroll.current?.scrollToEnd({ animated: true })}>
          {empty ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 40 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#E8833F' }} />
              <Text style={{ fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }), fontSize: 27, color: colors.ink, textAlign: 'center' }}>{greeting(profile.me?.name)}</Text>
              {privateChat ? <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>{tr('Private chat: not saved, and Myra does not learn from it.')}</Text> : null}
              {session && !busy ? (
                <View style={{ gap: 8, alignItems: 'center', marginTop: 8 }}>
                  {SUGGESTIONS[page].map(q => (
                    <Pressable key={q} onPress={() => send(tr(q))} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
                      <Text style={{ color: colors.ink }}>{tr(q)}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : messages.map((m, i) => (
            <View key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '86%', padding: 12, borderRadius: 18, gap: 8,
              backgroundColor: m.role === 'user' ? colors.accent : colors.surface,
              borderBottomRightRadius: m.role === 'user' ? 6 : 18, borderBottomLeftRadius: m.role === 'user' ? 18 : 6,
            }}>
              {m.attach?.uri ? <Image source={{ uri: m.attach.uri }} style={{ width: 180, height: 135, borderRadius: 10 }} resizeMode="cover" /> : null}
              {m.attach && !m.attach.uri ? (
                <Text style={{ color: m.role === 'user' ? colors.onAccent : colors.ink, fontSize: 13 }}>📎 {m.attach.name}</Text>
              ) : null}
              <Text selectable style={{ color: m.role === 'user' ? colors.onAccent : colors.ink, fontSize: 15, lineHeight: 22 }}>{m.text}</Text>
              {m.offer ? (
                <View style={{ gap: 4 }}>
                  <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700' }}>{m.offer.title}</Text>
                  {m.offer.lines.map((l, k) => <Text key={k} style={{ color: colors.ink, fontSize: 14, lineHeight: 20, paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: colors.line }}>{l}</Text>)}
                  <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 4 }}>→ {m.offer.where}</Text>
                  {!m.offer.state ? (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                      <Pressable onPress={() => decide(i, true)} accessibilityRole="button" style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, backgroundColor: colors.insight }}>
                        <Text style={{ color: colors.onInsight, fontWeight: '700' }}>{tr('Add to my day')}</Text>
                      </Pressable>
                      <Pressable onPress={() => decide(i, false)} accessibilityRole="button" style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, borderColor: colors.line }}>
                        <Text style={{ color: colors.ink, fontWeight: '600' }}>{tr('No')}</Text>
                      </Pressable>
                    </View>
                  ) : <Text style={{ color: colors.muted, fontSize: 13 }}>{m.offer.state === 'added' ? tr('Added') : tr('Not added')}</Text>}
                </View>
              ) : null}
            </View>
          ))}
          {busy ? <Note>{tr('Myra is thinking…')}</Note> : null}
        </ScrollView>

        <View style={{ paddingHorizontal: 12, paddingBottom: 6, gap: 6 }}>
          {session ? (
            <>
              {file ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 12, backgroundColor: colors.tint }}>
                  {file.uri ? <Image source={{ uri: file.uri }} style={{ width: 40, height: 40, borderRadius: 6 }} /> : <Ionicons name="document-text-outline" size={24} color={colors.accent} />}
                  <Text numberOfLines={1} style={{ flex: 1, color: colors.ink }}>{file.name}</Text>
                  <Pressable onPress={() => setFile(null)} hitSlop={8} accessibilityLabel={tr('Remove')}><Ionicons name="close" size={20} color={colors.muted} /></Pressable>
                </View>
              ) : null}
              {listening ? <Text style={{ color: colors.insight, fontWeight: '600', paddingHorizontal: 6 }}>{tr('Listening… tap the microphone again when you finish.')}</Text> : null}
              {note ? <Text style={{ color: colors.muted, paddingHorizontal: 6 }}>{note}</Text> : null}
              {/* The bar, like Claude's: ＋ · type or hold to talk · 🎙 · voice mode (Send ↑ once something is typed) */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, padding: 7, borderRadius: 26, backgroundColor: colors.surface,
                shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
                {round('add', tr('Attach a photo or document'), () => setMenu(true))}
                <TextInput style={{ flex: 1, maxHeight: 120, fontSize: 16, color: colors.ink, paddingHorizontal: 6, paddingVertical: 9 }} value={text} onChangeText={setText}
                  placeholder={empty ? tr('Type or hold to talk') : hint} placeholderTextColor={colors.muted} multiline
                  onFocus={() => setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 300)} />
                {round(listening ? 'stop' : 'mic-outline', tr('Speak'), () => { if (!holding.current) speak(); }, listening ? colors.insight : colors.field, listening ? colors.onInsight : colors.ink,
                  () => { holding.current = true; if (!listening) speak(); },
                  () => { if (holding.current) { holding.current = false; setTimeout(() => speak(), 250); } })}
                {typing ? round('arrow-up', tr('Send'), () => send(text), colors.accent, '#fff')
                  : round('pulse-outline', tr('Talk with Myra'), () => setVoice(true), colors.ink, '#fff')}
              </View>
              {!kb ? <Text style={{ color: colors.muted, fontSize: 11.5, textAlign: 'center' }}>{tr('Myra can make mistakes. Not medical advice.')}</Text> : null}
            </>
          ) : <Note>{tr('Sign in to talk to Myra (Profile, top right of Today → Sign in).')}</Note>}
        </View>
      </View>

      {/* ＋ : Camera · Photos · Files, then Myra's shortcuts */}
      <Modal visible={menu} transparent animationType="slide" onRequestClose={() => setMenu(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setMenu(false)} />
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 16 + insets.bottom, gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
            {Platform.OS !== 'web' ? tile(tr('Camera'), 'camera-outline', () => pickPhoto(true)) : null}
            {tile(tr('Photos'), 'image-outline', () => pickPhoto(false))}
            {tile(tr('Files'), 'document-outline', pickDocument)}
          </View>
          {plus(tr('Snap a meal'), 'restaurant-outline', goBody)}
          {plus(tr('Handwritten to-do list'), 'list-outline', () => { setText(tr('Add these to my to-dos')); pickPhoto(true); })}
          {plus(tr('Lab report'), 'flask-outline', () => { setText(tr('Please read my lab report simply.')); pickDocument(); })}
          {plus(tr('Send feedback to the team'), 'chatbubble-ellipses-outline', () => { setMenu(false); router.push({ pathname: '/feedback', params: { from: page } }); })}
        </View>
      </Modal>

      {/* ☰ : past chats */}
      <Modal visible={history} transparent animationType="slide" onRequestClose={() => setHistory(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setHistory(false)} />
        <View style={{ maxHeight: '75%', backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 16 + insets.bottom }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ flex: 1, color: colors.ink, fontSize: 18, fontWeight: '700' }}>{tr('Chats')}</Text>
            <Pressable onPress={() => startNew()} hitSlop={8}><Text style={{ color: colors.accent, fontWeight: '600' }}>✎ {tr('New chat')}</Text></Pressable>
          </View>
          <ScrollView>
            {chats.length ? chats.map(c => (
              <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.line }}>
                <Pressable style={{ flex: 1 }} onPress={() => openChat(c)}>
                  <Text numberOfLines={1} style={{ color: colors.ink, fontSize: 15, fontWeight: c.id === chatId ? '700' : '400' }}>{c.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{new Date(c.at).toLocaleDateString(lang() === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}</Text>
                </Pressable>
                <Pressable onPress={() => removeChat(c.id)} hitSlop={8} accessibilityLabel={tr('Delete')}><Ionicons name="trash-outline" size={18} color={colors.muted} /></Pressable>
              </View>
            )) : <Note>{tr('No chats yet.')}</Note>}
          </ScrollView>
        </View>
      </Modal>

      <MyraVoice open={voice} onClose={() => setVoice(false)} ask={q => send(q)} />
    </SafeAreaView>
  );
}
