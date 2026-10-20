// A feedback box at the top of every tab during testing, so testers can say what they think without looking for it.
// Saves to the "feedback" table (migration 0003) with the page it came from. Turn off by setting SHOW_FEEDBACK to false.

import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { Button, s } from './ui';
import { tr } from '../lib/i18n';

export const SHOW_FEEDBACK = true; // testing phase
const FACES = ['😞', '😕', '😐', '🙂', '😍'];

export function FeedbackBox({ area }: { area: string }) {
  const { session } = useAuth();
  const [text, setText] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!SHOW_FEEDBACK || !session || !supabase) return null;

  const send = async () => {
    if (!text.trim() || !supabase) return;
    setBusy(true); setError(null);
    const { error: e } = await supabase.from('feedback').insert({
      email: session.user.email, area, rating, message: text.trim(), app_version: Constants.expoConfig?.version ?? 'web',
    });
    setBusy(false);
    if (e) { setError(tr('Could not send just now. Please try again.')); return; }
    setText(''); setRating(null); setDone(true);
    setTimeout(() => setDone(false), 4000);
  };

  if (done) return <Text style={{ color: colors.good, fontWeight: '600', textAlign: 'center' }}>{tr('Thank you! Your feedback reached the Happy Orange team. 🍊')}</Text>;

  const open = text.trim().length > 0;
  return (
    <View style={{ gap: 8, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.accent + '55', padding: 10 }}>
      <TextInput style={[s.input, { borderColor: 'transparent' }, open && { minHeight: 60 }]} value={text} onChangeText={setText} multiline={open}
        placeholder={tr('💬 Your feedback on {area}: type here', { area: tr(area) })} placeholderTextColor={colors.muted} />
      {open && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {FACES.map((f, i) => (
            <Pressable key={f} accessibilityLabel={`${i + 1} of 5`} onPress={() => setRating(rating === i + 1 ? null : i + 1)}
              style={{ padding: 4, borderRadius: 10, borderWidth: 1, borderColor: rating === i + 1 ? colors.accent : 'transparent' }}>
              <Text style={{ fontSize: 22 }}>{f}</Text>
            </Pressable>
          ))}
          <View style={{ flex: 1 }} />
          <Button title={busy ? tr('Sending…') : tr('Send')} onPress={send} disabled={busy} />
        </View>
      )}
      {error ? <Text style={{ color: colors.bad }}>{error}</Text> : null}
    </View>
  );
}
