// Today's Ask Myra box (founder, 31 Oct 2026): only the chat box at the bottom of Today; her one recommendation sits beside
// the total score (MyraPick, decision 0040). Asking opens her chat with the question already sent. On Today this box
// replaces the floating Myra button. GuidanceCard runs headless here so Myra's advice for each card keeps refreshing.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { tr } from '../lib/i18n';
import { colors } from '../theme';
import { GuidanceCard } from './AiBits';

export function MyraCard() {
  const { session } = useAuth();
  const [q, setQ] = useState('');
  const ask = (question: string) => {
    const t = question.trim();
    router.push({ pathname: '/myra', params: t ? { from: 'today', q: t } : { from: 'today' } });
    setQ('');
  };
  return (
    <>
      <GuidanceCard headless />
      {session ? (
        <>
          {/* Like Claude's message box (founder, 31 Oct 2026): the words on top; + on the left; microphone and a round
              dark button on the right (send when there are words, otherwise talk to Myra). */}
          {/* Grows to fill the space left at the bottom of Today (founder, 1 Nov 2026). */}
          <View style={{ flexGrow: 1, minHeight: 104, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 10, gap: 6,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <TextInput style={{ flex: 1, fontSize: 17, color: colors.ink, minHeight: 28, paddingHorizontal: 4, paddingVertical: 2, textAlignVertical: 'top' }} value={q} onChangeText={setQ}
              placeholder={tr('Ask Myra anything…')} placeholderTextColor={colors.muted} multiline returnKeyType="send" blurOnSubmit onSubmitEditing={() => ask(q)} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable onPress={() => router.push({ pathname: '/myra', params: { from: 'today', attach: '1' } })} accessibilityLabel={tr('Attach a photo or document')}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.insight + '14', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={24} color={colors.insight} />
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => router.push({ pathname: '/myra', params: { from: 'today', listen: '1' } })} accessibilityLabel={tr('Speak')}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.insight + '14', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="mic-outline" size={21} color={colors.insight} />
              </Pressable>
              <Pressable onPress={() => ask(q)} accessibilityLabel={q.trim() ? tr('Send') : tr('Talk to Myra')}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.insight, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={q.trim() ? 'arrow-up' : 'pulse'} size={20} color={colors.onInsight} />
              </Pressable>
            </View>
          </View>
        </>
      ) : null}
    </>
  );
}
