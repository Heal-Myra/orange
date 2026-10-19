// Account: who is signed in, where data is saved, sign out, delete my data.

import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Heading, Note, Screen } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useHeal } from '../lib/store';
import { colors } from '../theme';

const SYNC_TEXT = {
  device: 'Saved on this device only.',
  syncing: 'Saving to your account…',
  saved: 'Saved to your account (Mumbai, India).',
  error: 'Could not reach your account just now. Your entries are safe on this device and will be saved when the connection is back.',
} as const;

export default function Account() {
  const { session, online, signOut, deleteMyData, leaveGuest, admin } = useAuth();
  const { sync, syncError, clearDevice } = useHeal();
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const remove = async () => {
    const err = await deleteMyData();
    if (err) { setMessage(err); return; }
    await clearDevice();
    router.replace('/sign-in');
  };

  return (
    <Screen showDay={false}>
      <Button kind="plain" title="‹ Back to Today" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <Card>
        <Heading>{session ? 'Signed in' : 'Not signed in'}</Heading>
        <Text style={{ color: colors.ink }}>{session?.user.email ?? 'You are using Happy Orange on this device only.'}</Text>
        <Note>{SYNC_TEXT[sync]}</Note>
        {sync === 'error' && syncError ? <Text selectable style={{ color: colors.bad, fontSize: 12 }}>Details for Claude: {syncError}</Text> : null}
        {session
          ? <Button kind="plain" title="Sign out" onPress={async () => { await signOut(); router.replace('/sign-in'); }} />
          : online ? <Button title="Sign in to save online" onPress={async () => { await leaveGuest(); router.replace('/sign-in'); }} /> : null}
      </Card>

      {admin && (
        <Card>
          <Heading>Admin</Heading>
          <Note>Approve AI access for testers and read their feedback.</Note>
          <Button title="Open admin" onPress={() => router.push('/admin')} />
        </Card>
      )}

      <Card>
        <Heading>Help us improve</Heading>
        <Note>Tell the Happy Orange team what works and what does not.</Note>
        <Button title="Send feedback" onPress={() => router.push('/feedback')} />
      </Card>

      {session && (
        <Card>
          <Heading>Delete my data</Heading>
          <Note>This permanently removes every entry and setting saved to your account, then signs you out.</Note>
          {confirm ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.bad, fontWeight: '600' }}>Are you sure? This cannot be undone.</Text>
              <Button title="Yes, delete everything" onPress={remove} />
              <Button kind="plain" title="Keep my data" onPress={() => setConfirm(false)} />
            </View>
          ) : <Button kind="plain" title="Delete my data…" onPress={() => setConfirm(true)} />}
          {message ? <Text style={{ color: colors.bad }}>{message}</Text> : null}
        </Card>
      )}
    </Screen>
  );
}
