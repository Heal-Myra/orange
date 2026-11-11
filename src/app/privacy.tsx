// Privacy and permissions (founder, 6 Nov 2026): what the app may use on the phone, where your data is kept, and
// deleting it. Replaces the "Delete my data" card on Profile.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, Heading, Note } from '../components/ui';
import { useHealth } from '../components/HealthSync';
import { useAuth } from '../lib/auth';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';

function Line({ icon, title, line, right }: { icon: keyof typeof Ionicons.glyphMap; title: string; line: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>{title}</Text>
        <Text style={{ fontSize: 12.5, color: colors.muted }}>{line}</Text>
      </View>
      {right}
    </View>
  );
}

export default function Privacy() {
  const { deleteMyData } = useAuth();
  const { clearDevice } = useHeal();
  const health = useHealth();
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const settings = () => Linking.openSettings().catch(() => setMessage(tr('Open iPhone Settings › Happy Orange to change these.')));
  const remove = async () => {
    const err = await deleteMyData();
    if (err) { setMessage(err); return; }
    await clearDevice();
    router.replace('/sign-in');
  };
  const link = (t: string, on: () => void) => <Pressable onPress={on} hitSlop={8}><Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>{t}</Text></Pressable>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
      <Card style={{ gap: 0 }}>
        <Heading>{tr('Permissions')}</Heading>
        <Note>{tr('What Happy Orange may use on this phone. You can change any of them at any time.')}</Note>
        <View style={{ height: 8 }} />
        <Line icon="heart-outline" title="Apple Health" line={tr('Everything Health shares, from your Watch and other devices (read only). Kept in your account for Myra to learn from.')}
          right={health.connected ? link(tr('Change'), settings) : link(tr('Connect'), () => router.push('/connect-health'))} />
        <Line icon="notifications-outline" title={tr('Notifications')} line={tr("Myra's reminders at the right time of day")} right={link(tr('Change'), settings)} />
        <Line icon="camera-outline" title={tr('Camera and photos')} line={tr('Meal photos, screenshots, selfies for Face & beauty')} right={link(tr('Change'), settings)} />
        <Line icon="mic-outline" title={tr('Microphone')} line={tr('Speaking to Myra instead of typing')} right={link(tr('Change'), settings)} />
        <Line icon="git-network-outline" title={tr('Connectors')} line="NeoSapien · Google Calendar · Gmail" right={link(tr('Open'), () => router.push('/connectors'))} />
      </Card>

      <Card style={{ gap: 6 }}>
        <Heading>{tr('Where your data is kept')}</Heading>
        <Note>{tr('Your entries are saved on this phone and in your Happy Orange account in Mumbai, India.')}</Note>
        <Note>{tr("Myra's answers come from Claude through a paid service that does not use your data to train AI.")}</Note>
        <Note>{tr('From connectors, only short suggestions are kept, never full conversations.')}</Note>
      </Card>

      <Card style={{ gap: 8 }}>
        <Heading>{tr('Delete my data')}</Heading>
        <Note>{tr('This permanently removes every entry and setting saved to your account, then signs you out.')}</Note>
        {confirm ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.bad, fontWeight: '600' }}>{tr('Are you sure? This cannot be undone.')}</Text>
            <Button title={tr('Yes, delete everything')} onPress={remove} />
            <Button kind="plain" title={tr('Keep my data')} onPress={() => setConfirm(false)} />
          </View>
        ) : <Button kind="plain" title={tr('Delete my data…')} onPress={() => setConfirm(true)} />}
      </Card>
      {message ? <Note>{message}</Note> : null}
    </ScrollView>
  );
}
