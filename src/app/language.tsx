// The very first screen: choose English or Hindi. The whole app, Myra and her recommendations follow it.
// Changeable later in Profile → Language.

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '../components/ui';
import { useLang, type Lang } from '../lib/i18n';
import { colors, shadow } from '../theme';

const OPTIONS: { id: Lang; name: string; hint: string }[] = [
  { id: 'en', name: 'English', hint: 'Use Happy Orange in English' },
  { id: 'hi', name: 'हिंदी', hint: 'हैप्पी ऑरेंज को हिंदी में इस्तेमाल करें' },
];

export default function LanguageScreen() {
  const { lang, chosen, setLang } = useLang();
  const choose = (l: Lang) => {
    const wasChosen = chosen;
    setLang(l);
    if (wasChosen && router.canGoBack()) router.back(); else router.replace('/');
  };
  return (
    <Screen showDay={false}>
      <View style={{ gap: 6, paddingTop: 32, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 30, color: colors.brand, fontWeight: '700' }}>Happy Orange</Text>
        <Text style={{ fontSize: 17, color: colors.ink }}>Choose your language · अपनी भाषा चुनें</Text>
      </View>
      {OPTIONS.map(o => {
        const on = chosen && lang === o.id;
        return (
          <Pressable key={o.id} accessibilityRole="button" onPress={() => choose(o.id)}
            style={({ pressed }) => ({ backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 4, boxShadow: shadow,
              borderWidth: on ? 2 : 1, borderColor: on ? colors.accent : colors.line, opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink }}>{o.name}{on ? '  ✓' : ''}</Text>
            <Text style={{ color: colors.muted }}>{o.hint}</Text>
          </Pressable>
        );
      })}
      <Text style={{ color: colors.muted, paddingHorizontal: 4 }}>You can change this later in Profile. · आप इसे बाद में प्रोफ़ाइल में बदल सकते हैं।</Text>
    </Screen>
  );
}
