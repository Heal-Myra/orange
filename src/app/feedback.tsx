// Send feedback: testers tell the team what works and what does not. Saved to the Supabase "feedback" table
// (migration 0003), where the founder reads it in the Table Editor.

import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Note, Screen, TextField } from '../components/ui';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { tr } from '../lib/i18n';

const AREAS = ['Today', 'Body', 'Mind', 'Soul', 'Library', 'Myra', 'Sign-in', 'Other'];
const FACES = ['😞', '😕', '😐', '🙂', '😍'];

export default function Feedback() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { session } = useAuth();
  const start = typeof from === 'string' ? AREAS.find(a => a.toLowerCase() === from.toLowerCase()) : undefined;
  const [area, setArea] = useState(start ?? 'Other');
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!supabase || !session || !message.trim()) return;
    setBusy(true); setResult(null);
    const { error } = await supabase.from('feedback').insert({
      email: session.user.email, area, rating, message: message.trim(), app_version: Constants.expoConfig?.version ?? 'web',
    });
    setBusy(false);
    if (error) setResult(tr('Could not send just now ({error}). Please try again later.', { error: error.message }));
    else { setSent(true); setMessage(''); }
  };

  if (sent) {
    return (
      <Screen showDay={false}>
        <Card style={{ alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 40 }}>🍊</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink, textAlign: 'center' }}>{tr('Thank you. Your feedback reached the Happy Orange team.')}</Text>
          <Button title={tr('Back to the app')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          <Button kind="plain" title={tr('Send more')} onPress={() => setSent(false)} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen showDay={false}>
      <Card>
        <Text style={{ color: colors.ink, lineHeight: 22 }}>{tr('What works, what is confusing, what you wish it did. Every message is read.')}</Text>
        {!session ? <Note>{tr('Please sign in first, so we can reply to you.')}</Note> : (
          <>
            <Text style={{ fontWeight: '600', color: colors.ink }}>{tr('How do you feel about Happy Orange so far?')}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {FACES.map((f, i) => (
                <Pressable key={f} accessibilityLabel={`${i + 1} of 5`} onPress={() => setRating(i + 1)}
                  style={{ padding: 8, borderRadius: 14, borderWidth: 1, borderColor: rating === i + 1 ? colors.accent : 'transparent', backgroundColor: rating === i + 1 ? colors.surface : 'transparent' }}>
                  <Text style={{ fontSize: 30 }}>{f}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ fontWeight: '600', color: colors.ink }}>{tr('About which part?')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {AREAS.map(a => (
                <Pressable key={a} onPress={() => setArea(a)}
                  style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: a === area ? colors.accent : colors.line, backgroundColor: colors.surface }}>
                  <Text style={{ color: colors.ink, fontWeight: a === area ? '700' : '400' }}>{tr(a)}</Text>
                </Pressable>
              ))}
            </View>
            <TextField label={tr('Your feedback')} value={message} onChangeText={setMessage} multiline
              placeholder={tr('e.g. The meal photo got my dal right but missed the ghee.')} />
            <Button title={busy ? tr('Sending…') : tr('Send feedback')} onPress={send} disabled={busy || !message.trim()} />
            {result ? <Text style={{ color: colors.bad }}>{result}</Text> : null}
          </>
        )}
      </Card>
    </Screen>
  );
}
