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
import { Card, s } from './ui';

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
          <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 11, letterSpacing: 0.4, marginTop: 4 }}>{tr('ASK MYRA')}</Text>
          {/* Like Claude's message box (founder, 31 Oct 2026): the words on top; + on the left; microphone and a round
              dark button on the right (send when there are words, otherwise talk to Myra). */}
          <View style={{ borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', borderRadius: 26, padding: 12, gap: 10,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <TextInput style={{ fontSize: 17, color: colors.ink, minHeight: 28, paddingHorizontal: 4, paddingVertical: 2 }} value={q} onChangeText={setQ}
              placeholder={tr('Ask Myra anything…')} placeholderTextColor={colors.muted} multiline returnKeyType="send" blurOnSubmit onSubmitEditing={() => ask(q)} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable onPress={() => router.push({ pathname: '/myra', params: { from: 'today', attach: '1' } })} accessibilityLabel={tr('Attach a photo or document')}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.insight + '14', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={24} color={colors.insight} />
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => router.push({ pathname: '/myra', params: { from: 'today', listen: '1' } })} accessibilityLabel={tr('Speak')}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.insight + '14', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="mic-outline" size={21} color={colors.insight} />
              </Pressable>
              <Pressable onPress={() => ask(q)} accessibilityLabel={q.trim() ? tr('Send') : tr('Talk to Myra')}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.insight, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={q.trim() ? 'arrow-up' : 'pulse'} size={20} color={colors.onInsight} />
              </Pressable>
            </View>
          </View>
        </>
      ) : null}
    </Card>
  );
}
