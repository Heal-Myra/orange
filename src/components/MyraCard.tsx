// Today's Myra card (founder, 31 Oct 2026): under the scores, one card for Myra: her one recommendation as a horizontal
// row (speaking to the person by name), then "Ask Myra anything" with the chat sign, a microphone and send. Asking opens
// her chat with the question already sent. On Today this card replaces the floating Myra button.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { tr } from '../lib/i18n';
import { colors } from '../theme';
import { GuidanceCard } from './AiBits';
import { Card, Note, s } from './ui';

const QUICK = ['How is my week going?', 'What should I eat tonight?'];

export function MyraCard() {
  const { session } = useAuth();
  const [q, setQ] = useState('');
  const ask = (question: string) => {
    const t = question.trim();
    router.push({ pathname: '/myra', params: t ? { from: 'today', q: t } : { from: 'today' } });
    setQ('');
  };
  return (
    <Card style={{ gap: 10, borderWidth: 1.5, borderColor: colors.insight + '30' }}>
      <GuidanceCard embedded />
      {session ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: '#F8FAFB', borderRadius: 99, paddingLeft: 14, paddingRight: 5, paddingVertical: 4 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.muted} />
            <TextInput style={[s.input, { flex: 1, minWidth: 0, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 }]} value={q} onChangeText={setQ}
              placeholder={tr('Ask Myra anything…')} placeholderTextColor={colors.muted} returnKeyType="send" onSubmitEditing={() => ask(q)} />
            {!q.trim() ? (
              <Pressable onPress={() => router.push({ pathname: '/myra', params: { from: 'today', listen: '1' } })} hitSlop={8} accessibilityLabel={tr('Speak')}>
                <Ionicons name="mic-outline" size={22} color={colors.muted} />
              </Pressable>
            ) : null}
            <Pressable onPress={() => ask(q)} accessibilityLabel={tr('Send')}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.insight, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-up" size={20} color={colors.onInsight} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {QUICK.map(x => (
              <Pressable key={x} onPress={() => ask(tr(x))} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 99, borderWidth: 1, borderColor: colors.insight + '66' }}>
                <Text style={{ color: colors.insight, fontWeight: '600', fontSize: 12.5 }}>{tr(x)}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
      <Note>{tr('Not medical advice.')}</Note>
    </Card>
  );
}
