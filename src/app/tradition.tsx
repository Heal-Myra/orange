// Daily Wisdom tradition: asked once after sign-up (optional) and changeable from Profile.
// Kept private: on this device and in the person's own account, used only to choose the day's passage.

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Card, Heading, Note, Screen } from '../components/ui';
import { useAuth } from '../lib/auth';
import { TRADITIONS, type Tradition } from '../lib/wisdom';
import { colors } from '../theme';
import { tr } from '../lib/i18n';

export default function TraditionScreen() {
  const { tradition, setTradition } = useAuth();
  const choose = async (t: Tradition) => {
    await setTradition(t);
    if (router.canGoBack()) router.back(); else router.replace('/');
  };

  return (
    <Screen showDay={false}>
      <Card>
        <Heading>{tr('Your Daily Wisdom')}</Heading>
        <Note>{tr('Each day the Soul tab shows one short passage to read and reflect on. Which tradition would you like it from? You can change this any time in Profile.')}</Note>
      </Card>
      {TRADITIONS.map(t => {
        const on = tradition === t.id;
        return (
          <Pressable key={t.id} accessibilityRole="button" onPress={() => choose(t.id)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14,
              borderColor: on ? colors.accent : colors.line, borderWidth: on ? 2 : 1 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>{tr(t.name)}</Text>
                <Text style={{ color: colors.muted }}>{tr(t.text)}</Text>
              </View>
              {on ? <Text style={{ color: colors.accent, fontWeight: '700' }}>✓</Text> : null}
            </Card>
          </Pressable>
        );
      })}
      <Pressable onPress={() => choose('universal')} style={{ alignItems: 'center', padding: 10 }}>
        <Text style={{ color: colors.muted }}>{tr('Prefer not to say (shows Universal wisdom)')}</Text>
      </Pressable>
      <Note>{tr('Your choice stays private: only you can see it, and it is used only to pick your daily passage.')}</Note>
    </Screen>
  );
}
