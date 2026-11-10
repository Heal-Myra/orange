// Profile: who you are, your details, connectors, privacy and permissions, admin (admins only), log out.

import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Share, Text, View } from 'react-native';
import { Button, Card, Expandable, Heading, Note, Screen } from '../components/ui';
import { useNeoSapien } from '../lib/neosapien';
import { useHealth } from '../components/HealthSync';
import { useAuth } from '../lib/auth';
import { usePendingRequests } from '../lib/adminAlerts';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { SPACES, afterDue, spacesScore } from '../lib/spaces';
import { todayISO } from '../lib/dates';
import { lang, tr } from '../lib/i18n';
import { traditionName } from '../lib/wisdom';
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
  const { session, online, signOut, leaveGuest, admin, tradition } = useAuth();
  const pending = usePendingRequests(); // 0 for everyone except admins
  const { sync, syncError, profile } = useHeal();
  const [message, setMessage] = useState<string | null>(null);

  const invite = async () => {
    try { await Share.share({ message: INVITE }); }
    catch { setMessage(tr('Sharing is not available here. Send this link yourself: https://testflight.apple.com/join/Mcp2jHbc')); }
  };
  const me = profile.me;
  const profileLine = me ? [me.name, `${me.weightKg} kg`, lang() === 'hi' ? 'हिंदी' : 'English', tradition ? tr(traditionName(tradition)) : null].filter(Boolean).join(' · ') : tr('Not set yet');
  const aboutLine = me
    ? `${me.goal === 'lose' ? tr('Lose {kg} kg', { kg: me.goalKg ?? 0 }) : me.goal === 'gain' ? tr('Gain {kg} kg', { kg: me.goalKg ?? 0 }) : tr('Keep weight')} · ${profile.kcal} kcal`
    : tr('Not set yet');

  // A neat Profile (founder, 6 Nov 2026): who you are, your details in one card, connectors, privacy & permissions;
  // admin for admins; log out at the very bottom. Feedback goes through Myra; the Library lives on the server.
  return (
    <Screen showDay={false}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent + '18', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.accent }}>{(me?.name ?? session?.user.email ?? '?').trim().charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 19, fontWeight: '700', color: colors.ink }}>{me?.name || tr('Your profile')}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{session?.user.email ?? tr('You are using Happy Orange on this device only.')}</Text>
          <Text style={{ color: sync === 'error' ? colors.warn : colors.muted, fontSize: 12, marginTop: 2 }}>{tr(SYNC_TEXT[sync])}</Text>
          {sync === 'error' && syncError ? <Text selectable style={{ color: colors.muted, fontSize: 11 }}>Details for Claude: {syncError}</Text> : null}
        </View>
      </Card>

      <Card style={{ paddingVertical: 4, gap: 0 }}>
        {/* My profile (who you are now, with language and Daily Wisdom), My goals, Spaces (founder, 10 Nov 2026). */}
        <Row icon="person-outline" title={tr('My profile')} line={profileLine} onPress={() => router.push({ pathname: '/about-you', params: { part: 'profile' } })} />
        <Row icon="flag-outline" title={tr('My goals')} line={aboutLine} onPress={() => router.push({ pathname: '/about-you', params: { part: 'goals' } })} />
        <SpacesRow last />
      </Card>

      {session ? (
        <Card style={{ paddingVertical: 4, gap: 0 }}>
          <ConnectorsRow />
          <Row icon="shield-checkmark-outline" title={tr('Privacy and permissions')} line={tr('Permissions, where your data is kept, delete your data')} onPress={() => router.push('/privacy')} last />
        </Card>
      ) : null}

      {admin && (
        <Card>
          <Heading>{tr('Admin')}</Heading>
          <Note>{tr('Approve AI access for testers and read their feedback.')}</Note>
          {pending > 0 && <Text style={{ color: colors.brand, fontWeight: '700' }}>● {tr('{n} AI requests waiting for you', { n: pending })}</Text>}
          <Button title={tr('Open admin')} onPress={() => router.push('/admin')} />
          <Button kind="plain" title={tr('Invite a friend to test')} onPress={invite} />
          {message ? <Note>{message}</Note> : null}
        </Card>
      )}

      {session
        ? <Button kind="plain" title={tr('Log out')} onPress={async () => { await signOut(); router.replace('/sign-in'); }} />
        : online ? <Button title={tr('Sign in to save online')} onPress={async () => { await leaveGuest(); router.replace('/sign-in'); }} /> : null}
      {/* Which version is running (25 Oct 2026), so a missing quick update can be spotted. */}
      <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>{versionLine()}</Text>
    </Screen>
  );
}

/** One row inside a grouped card: icon, name, one-line status, chevron. */
function Row({ icon, title, line, onPress, last }: { icon: keyof typeof Ionicons.glyphMap; title: string; line: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.line }}>
      <Ionicons name={icon} size={22} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>{title}</Text>
        <Text style={{ fontSize: 13, color: colors.muted }} numberOfLines={1}>{line}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

/** Spaces (decision 0055): a home set up to help you. */
function SpacesRow({ last }: { last?: boolean }) {
  const { profile } = useHeal();
  const all = profile.me?.spaces ?? {};
  const today = todayISO();
  const n = SPACES.filter(x => all[x.id]).length;
  const due = SPACES.find(x => afterDue(all[x.id], today));
  const sc = spacesScore(all);
  const line = due ? tr('Time for an after photo') : sc != null ? tr('Spaces score {n} · {m} snapped', { n: sc, m: n }) : n ? tr('{n} of {m} spaces set up', { n, m: SPACES.length }) : tr('Your home, set up to help you.');
  return <Row icon="home-outline" title={tr('Spaces')} line={line} onPress={() => router.push('/spaces')} last={last} />;
}

function ConnectorsRow() {
  const health = useHealth(), ns = useNeoSapien();
  const names = [health.connected ? 'Apple Health' : null, ns.connected ? 'NeoSapien' : null].filter(Boolean) as string[];
  return <Row icon="git-network-outline" title={tr('Connectors')} line={names.length ? `${tr('{n} connected', { n: names.length })} · ${names.join(', ')}` : tr('Apple Health, NeoSapien and more')} onPress={() => router.push('/connectors')} />;
}
