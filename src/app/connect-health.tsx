// Apple Health, asked once at the start (founder, 25 Oct 2026: "make it mandatory"). Apple's rules require that people
// can say no and the app still works, and iPhone never tells an app whether reading was refused, so this is a clear,
// warm request with the reasons, not a lock. Afterwards the Body tab keeps the Connect button for anyone who skipped.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Note, Screen } from '../components/ui';
import { useHealth } from '../components/HealthSync';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

export default function ConnectHealth() {
  const { connect, markAsked } = useHealth();
  const done = () => { markAsked(); router.replace('/'); };
  const Line = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Ionicons name={icon} size={20} color={colors.insight} />
      <Text style={{ flex: 1, color: colors.ink, fontSize: 15 }}>{text}</Text>
    </View>
  );
  return (
    <Screen showDay={false}>
      <View style={{ gap: 6, paddingTop: 32 }}>
        <Ionicons name="heart" size={36} color={colors.insight} />
        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink }}>{tr('Connect Apple Health')}</Text>
        <Text style={{ fontSize: 15, color: colors.muted, lineHeight: 22 }}>{tr('Happy Orange works best with it: Myra sees your day without you typing anything.')}</Text>
      </View>
      <Card style={{ gap: 12 }}>
        <Line icon="footsteps-outline" text={tr('Steps and workouts fill Movement')} />
        <Line icon="moon-outline" text={tr('Last night\'s sleep fills Sleep')} />
        <Line icon="scale-outline" text={tr('Weight from your scale keeps your targets right')} />
        <Line icon="pulse-outline" text={tr('Heart rate and HRV guide rest days')} />
        <Note>{tr('Read only: nothing is written to Apple Health. On the next screen, tap Turn On All, then Allow.')}</Note>
        <Button kind="insight" title={tr('Connect Apple Health')} onPress={async () => { await connect(); done(); }} />
      </Card>
      <Pressable onPress={done} style={{ alignItems: 'center', padding: 8 }} accessibilityRole="button">
        <Text style={{ color: colors.muted }}>{tr('Not now (you can connect later on the Body tab)')}</Text>
      </Pressable>
    </Screen>
  );
}
