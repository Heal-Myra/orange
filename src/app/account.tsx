// Profile: who is signed in, where data is saved, sign out, delete my data.

import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Share, Text, View } from 'react-native';
import { Button, Card, Heading, Note, Screen } from '../components/ui';
import { useAuth } from '../lib/auth';
import { traditionName } from '../lib/wisdom';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { lang, tr } from '../lib/i18n';

// The tester invitation (founder's wording, 19 Oct 2026). Shared through the phone's own share menu,
// so people are picked from the contacts in WhatsApp, Messages or any other app.
const INVITE = `Hi! 🍊 I’m building Happy Orange, an app that helps you restore healthy body and mind to connect with your inner self. Would you test it for me for a week and tell me honestly what you think?

How to start (2 minutes):
1. On your phone, open app.happyorange.in in Safari (iPhone) or Chrome (Android).
2. Add it to your home screen: iPhone: Share → Add to Home Screen. Android: ⋮ → Add to Home screen.
3. Open it, type your email and enter the 6-digit code you receive (check Spam if it doesn't arrive).

The AI features (meal photos, Myra's recommendations and chat) open up for you soon after you sign up.

Write in the feedback box at the top of any page whenever something works, confuses you, or you wish it did more. Every feedback counts.`;

const SYNC_TEXT = {
  device: 'Saved on this device only.',
  syncing: 'Saving to your account…',
  saved: 'Saved to your account (Mumbai, India).',
  error: 'Could not reach your account just now. Your entries are safe on this device and will be saved when the connection is back.',
} as const;

export default function Account() {
  const { session, online, signOut, deleteMyData, leaveGuest, admin, tradition } = useAuth();
  const { sync, syncError, clearDevice } = useHeal();
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const invite = async () => {
    try { await Share.share({ message: INVITE }); }
    catch { setMessage(tr('Sharing is not available here. Copy the link app.happyorange.in and send it yourself.')); }
  };

  const remove = async () => {
    const err = await deleteMyData();
    if (err) { setMessage(err); return; }
    await clearDevice();
    router.replace('/sign-in');
  };

  return (
    <Screen showDay={false}>
      <Button kind="plain" title={tr('‹ Back to Today')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <Card>
        <Heading>{session ? tr('Signed in') : tr('Not signed in')}</Heading>
        <Text style={{ color: colors.ink }}>{session?.user.email ?? tr('You are using Happy Orange on this device only.')}</Text>
        <Note>{tr(SYNC_TEXT[sync])}</Note>
        {sync === 'error' && syncError ? <Text selectable style={{ color: colors.bad, fontSize: 12 }}>Details for Claude: {syncError}</Text> : null}
        {session
          ? <Button kind="plain" title={tr('Sign out')} onPress={async () => { await signOut(); router.replace('/sign-in'); }} />
          : online ? <Button title={tr('Sign in to save online')} onPress={async () => { await leaveGuest(); router.replace('/sign-in'); }} /> : null}
      </Card>

      <Pressable onPress={() => router.push('/language')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="language-outline" size={24} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>{tr('Language')}</Text>
            <Note>{lang() === 'hi' ? 'हिंदी' : 'English'} · {tr('tap to change')}</Note>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/tradition')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="sparkles-outline" size={24} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>{tr('Daily Wisdom')}</Text>
            <Note>{tradition ? tr(traditionName(tradition)) : tr('Not chosen yet (Bhagavad Gita)')} · {tr('tap to change')}</Note>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/library')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="library-outline" size={24} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>{tr('Library')}</Text>
            <Note>{tr('Indian foods, Gita, Tao Te Ching and exercises')}</Note>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Card>
      </Pressable>

      {admin && (
        <Card>
          <Heading>{tr('Admin')}</Heading>
          <Note>{tr('Approve AI access for testers and read their feedback.')}</Note>
          <Button title={tr('Open admin')} onPress={() => router.push('/admin')} />
          <Button kind="plain" title={tr('Invite a friend to test')} onPress={invite} />
        </Card>
      )}

      {session && (
        <Card>
          <Heading>{tr('Delete my data')}</Heading>
          <Note>{tr('This permanently removes every entry and setting saved to your account, then signs you out.')}</Note>
          {confirm ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.bad, fontWeight: '600' }}>{tr('Are you sure? This cannot be undone.')}</Text>
              <Button title={tr('Yes, delete everything')} onPress={remove} />
              <Button kind="plain" title={tr('Keep my data')} onPress={() => setConfirm(false)} />
            </View>
          ) : <Button kind="plain" title={tr('Delete my data…')} onPress={() => setConfirm(true)} />}
          {message ? <Text style={{ color: colors.bad }}>{message}</Text> : null}
        </Card>
      )}
    </Screen>
  );
}
