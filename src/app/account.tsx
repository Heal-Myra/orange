// Profile: who is signed in, where data is saved, sign out, delete my data.

import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Share, Text, View } from 'react-native';
import { Button, Card, Expandable, Heading, Note, Screen } from '../components/ui';
import { FeedbackBox } from '../components/FeedbackBox';
import { useAuth } from '../lib/auth';
import { usePendingRequests } from '../lib/adminAlerts';
import { traditionName } from '../lib/wisdom';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { lang, tr } from '../lib/i18n';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** "Version 1.0.0 (10) · update 25 Oct 06:20" — the build, and the quick update it is running. */
function versionLine(): string {
  const v = Constants.expoConfig?.version ?? '';
  const build = Constants.expoConfig?.ios?.buildNumber ?? (Constants as unknown as { nativeBuildVersion?: string }).nativeBuildVersion ?? '';
  if (Platform.OS === 'web') return `${tr('Version')} ${v} · web`;
  try {
    const U = require('expo-updates') as typeof import('expo-updates');
    const when = U.createdAt ? U.createdAt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    return `${tr('Version')} ${v}${build ? ` (${build})` : ''} · ${U.isEmbeddedLaunch ? tr('built-in') : `${tr('update')} ${when}`}`;
  } catch { return `${tr('Version')} ${v}`; }
}

// The tester invitation (founder's wording, 19 Oct 2026; iPhone TestFlight version approved 25 Oct 2026). Shared through the phone's own share menu,
// so people are picked from the contacts in WhatsApp, Messages or any other app.
const INVITE = `Hi! 🍊 I’m building Happy Orange, an app that helps you restore healthy body and mind to connect with your inner self. Would you test it for me for a week and tell me honestly what you think?

How to start (3 minutes, iPhone only):
1. Install Apple's free TestFlight app from the App Store.
2. Open this link on your iPhone: https://testflight.apple.com/join/Mcp2jHbc, then tap Accept and Install.
3. Open Happy Orange, type your email and enter the 6-digit code you receive (check Spam if it doesn't arrive).
4. When asked, allow Apple Health, so your steps, sleep and weight fill in by themselves.

Write in the feedback box at the top of any page. Every feedback counts.`;

const SYNC_TEXT = {
  device: 'Saved on this device only.',
  syncing: 'Saving to your account…',
  saved: 'Saved to your account (Mumbai, India).',
  error: 'Could not reach your account just now. Your entries are safe on this device and will be saved when the connection is back.',
} as const;

export default function Account() {
  const { session, online, signOut, deleteMyData, leaveGuest, admin, tradition } = useAuth();
  const pending = usePendingRequests(); // 0 for everyone except admins
  const { sync, syncError, clearDevice, profile } = useHeal();
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const invite = async () => {
    try { await Share.share({ message: INVITE }); }
    catch { setMessage(tr('Sharing is not available here. Send this link yourself: https://testflight.apple.com/join/Mcp2jHbc')); }
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

      <Pressable onPress={() => router.push('/about-you')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="body-outline" size={24} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>{tr('About you')}</Text>
            <Note>{profile.me
              ? `${profile.me.weightKg} kg · ${profile.me.goal === 'lose' ? tr('Lose {kg} kg', { kg: profile.me.goalKg ?? 0 }) : profile.me.goal === 'gain' ? tr('Gain {kg} kg', { kg: profile.me.goalKg ?? 0 }) : tr('Keep weight')} · ${profile.kcal} kcal`
              : tr('Not set yet')} · {tr('tap to change')}</Note>
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

      {/* Send feedback (founder, 31 Oct 2026): moved here from the top of every page; folded until tapped. */}
      {session ? (
        <Card style={{ paddingVertical: 4 }}>
          <Expandable icon="chatbubble-ellipses-outline" title={tr('Send feedback')} status={tr('Tell us what to keep or improve')}>
            <View style={{ paddingBottom: 12 }}><FeedbackBox area="Profile" always /></View>
          </Expandable>
        </Card>
      ) : null}

      {admin && (
        <Card>
          <Heading>{tr('Admin')}</Heading>
          <Note>{tr('Approve AI access for testers and read their feedback.')}</Note>
          {pending > 0 && <Text style={{ color: colors.brand, fontWeight: '700' }}>● {tr('{n} AI requests waiting for you', { n: pending })}</Text>}
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
      {/* Which version is running (25 Oct 2026), so a missing quick update can be spotted. */}
      <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>{versionLine()}</Text>
    </Screen>
  );
}
