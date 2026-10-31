// A feedback box at the top of every tab during testing, so testers can say what they think without looking for it.
// Saves to the "feedback" table (migration 0003) with the page it came from. Turn off by setting SHOW_FEEDBACK to false.

import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { Button, s, useKeepVisible } from './ui';
import { tr } from '../lib/i18n';
import { readNoteText } from '../lib/ai';
import { useAttach } from './AttachPlus';

export const SHOW_FEEDBACK = false; // removed from the top of every page (founder, 31 Oct 2026); testers use TestFlight's Send Feedback
const FACES = ['😞', '😕', '😐', '🙂', '😍'];

export function FeedbackBox({ area }: { area: string }) {
  const keep = useKeepVisible();
  const { session } = useAuth();
  const [text, setText] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // "+": read a photo (a note, a screenshot) into the feedback (founder, 30 Oct 2026: the + in every text box).
  const plus = useAttach(async img => {
    const r = await readNoteText(img.data, img.media_type, 'Feedback about the app');
    const t = (r.text ?? '').trim();
    if (!t) return tr('No words found in that photo. Try a clearer one.');
    setText(x => (x.trim() ? `${x.trim()} ${t}` : t));
    return null;
  }, { size: 36 });
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <TextInput style={[s.input, { borderColor: 'transparent', flex: 1, minWidth: 0 }, open && { minHeight: 60 }]} value={text} onChangeText={setText} multiline={open} onFocus={() => setTimeout(keep, 300)} onContentSizeChange={() => keep()}
        placeholder={tr('💬 Your feedback on {area}: type here', { area: tr(area) })} placeholderTextColor={colors.muted} />
        {plus.button}
      </View>
      {plus.status}
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
