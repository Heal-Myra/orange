// Myra: the assistant. Helps people find their way around the app, explains scores and looks at their own data.
// Uses the heal-ai server function (needs sign-in; counts towards the daily AI cap).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Note, s } from '../components/ui';
import { askMyra, type ChatMessage } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { buildContext } from '../lib/context';
import { useHeal } from '../lib/store';
import { colors } from '../theme';

const KEY = 'heal.myra';
const HELLO: ChatMessage = { role: 'myra', text: "Hello, I'm Myra. I can help you find your way around Happy Orange, explain your scores, or look at how your week is going. What would you like?" };

const SUGGESTIONS: Record<string, string[]> = {
  today: ['How is my week going?', 'Why is my score what it is?', 'What is one thing I can improve today?'],
  body: ['How do I add a meal?', 'Is my protein enough today?', 'What should I eat for dinner?'],
  mind: ['How does the Mind score work?', 'Explain today\'s Tao practice', 'How can I cut mindless scrolling?'],
  soul: ['Explain today\'s verse simply', 'How do I add a reflection?', 'How does the Soul score work?'],
  library: ['What is in the Library?', 'Which foods are high in iron?', 'Suggest a simple home exercise'],
};

export default function Myra() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const page = typeof from === 'string' && SUGGESTIONS[from] ? from : 'today';
  const { session } = useAuth();
  const { day, days, date, profile } = useHeal();
  const [messages, setMessages] = useState<ChatMessage[]>([HELLO]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => { if (v) setMessages(JSON.parse(v)); }).catch(() => {});
  }, []);
  const save = (m: ChatMessage[]) => AsyncStorage.setItem(KEY, JSON.stringify(m.slice(-40))).catch(() => {});

  const send = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    const next: ChatMessage[] = [...messages, { role: 'user', text: question }];
    setMessages(next); setText(''); setBusy(true);
    try {
      const r = await askMyra(next.filter(m => m !== HELLO), buildContext(day, days, date, profile), page);
      const done: ChatMessage[] = [...next, { role: 'myra', text: r.text }];
      setMessages(done); save(done);
    } catch (e) {
      setMessages([...next, { role: 'myra', text: e instanceof Error ? e.message : 'Something went wrong. Please try again.' }]);
    } finally { setBusy(false); }
  };

  const clear = () => { setMessages([HELLO]); AsyncStorage.removeItem(KEY).catch(() => {}); };

  return (
    <SafeAreaView style={[s.safe]} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 10 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
          {messages.map((m, i) => (
            <View key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '86%', padding: 12, borderRadius: 16,
              backgroundColor: m.role === 'user' ? colors.accent : colors.surface, borderWidth: m.role === 'user' ? 0 : 1, borderColor: colors.line,
            }}>
              <Text selectable style={{ color: m.role === 'user' ? colors.onAccent : colors.ink, fontSize: 15, lineHeight: 22 }}>{m.text}</Text>
            </View>
          ))}
          {busy ? <Note>Myra is thinking…</Note> : null}
          {session && messages.length <= 2 && !busy && (
            <View style={{ gap: 8, paddingTop: 4 }}>
              {SUGGESTIONS[page].map(q => (
                <Pressable key={q} onPress={() => send(q)} style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.surface }}>
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>{q}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
        <View style={{ padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.line }}>
          {session ? (
            <>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                <TextInput style={[s.input, { flex: 1, maxHeight: 120 }]} value={text} onChangeText={setText} placeholder="Ask Myra anything…"
                  placeholderTextColor={colors.muted} multiline onSubmitEditing={() => send(text)} />
                <Button title="Send" onPress={() => send(text)} disabled={!text.trim() || busy} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Note>Myra can make mistakes. Not medical advice.</Note>
                {messages.length > 1 ? <Pressable onPress={clear}><Text style={{ color: colors.accent, fontWeight: '600', fontSize: 13 }}>Clear chat</Text></Pressable> : null}
              </View>
            </>
          ) : <Note>Sign in to talk to Myra (person icon on Today → Sign in).</Note>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
