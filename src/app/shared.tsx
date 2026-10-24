// Something shared to Happy Orange from YouTube, Instagram, a browser… (founder, 24 Oct 2026). Two uses:
// "Save to my journey" keeps it in the person's own list (Library › Saved), and Myra knows what inspires them;
// "Send to Happy Orange" passes it to the team as an idea for what Happy Orange could create (Admin › Feedback).

import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, Text } from 'react-native';
import { Button, Card, Heading, Note, Screen, TextField } from '../components/ui';
import { learnFromLink } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';

export default function Shared() {
  const { url = '', title = '' } = useLocalSearchParams<{ url?: string; title?: string }>();
  const { session } = useAuth();
  const { profile, setProfile } = useHeal();
  const [about, setAbout] = useState(title);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Myra says in a few words what it is about (from the page's own title and description).
  useEffect(() => {
    if (!url || !session) return;
    learnFromLink(url, title).then(r => { if (r.text) setAbout(r.text); }).catch(() => {});
  }, [url, title, session]);

  const save = () => {
    if (!profile.me) { setMsg(tr('Fill in About you first, so your saved list can go with your account.')); return; }
    const list = profile.me.saved ?? [];
    if (!list.some(x => x.url === url)) {
      setProfile({ ...profile, me: { ...profile.me, saved: [{ url, title: about || title || url, note: note.trim() || undefined, at: new Date().toISOString() }, ...list].slice(0, 200) } });
    }
    setSaved(true);
  };

  const send = async () => {
    if (!supabase || !session) { setMsg(tr('Sign in to send it to Happy Orange.')); return; }
    const { error } = await supabase.from('feedback').insert({
      email: session.user.email, area: 'Inspiration', message: [url, about || title, note.trim()].filter(Boolean).join('\n').slice(0, 4000),
      app_version: Constants.expoConfig?.version ?? 'web',
    });
    if (error) setMsg(tr('Could not send just now. Please try again.')); else setSent(true);
  };

  return (
    <Screen showDay={false}>
      <Card style={{ gap: 10 }}>
        <Heading>{tr('Shared with Happy Orange')}</Heading>
        <Pressable onPress={() => Linking.openURL(url).catch(() => {})}>
          <Text numberOfLines={2} style={{ color: colors.accent, textDecorationLine: 'underline' }}>{url}</Text>
        </Pressable>
        {about ? <Text style={{ color: colors.insight, fontSize: 16 }}>{about}</Text> : null}
        <TextField label={tr('A note (optional)')} value={note} onChangeText={setNote} multiline placeholder={tr('e.g. why it helps, or what Happy Orange could make like this')} />
        <Button kind="insight" title={saved ? tr('Saved to my journey ✓') : tr('Save to my journey')} onPress={save} disabled={saved || !url} />
        <Button kind="plain" title={sent ? tr('Sent to Happy Orange ✓') : tr('Send to Happy Orange as inspiration')} onPress={send} disabled={sent || !url} />
        <Note>{tr('Saved items are in Library › Saved, and Myra keeps them in mind. Inspiration goes to the Happy Orange team.')}</Note>
        {msg ? <Note>{msg}</Note> : null}
        {saved || sent ? <Button kind="plain" title={tr('Done')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} /> : null}
      </Card>
    </Screen>
  );
}
