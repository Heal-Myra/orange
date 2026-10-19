// Floating "Ask Myra" button shown on every tab. Opens the Myra chat and tells it which tab you were on.

import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export function MyraButton() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const page = path === '/' ? 'today' : path.replace('/', '') || 'today';
  return (
    <Pressable accessibilityLabel="Ask Myra, your assistant" onPress={() => router.push({ pathname: '/myra', params: { from: page } })}
      style={({ pressed }) => ({
        position: 'absolute', right: 16, bottom: insets.bottom + 80, flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: colors.insight, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 99, opacity: pressed ? 0.8 : 1,
        boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
      })}>
      <Ionicons name="sparkles" size={16} color={colors.onInsight} />
      <Text style={{ color: colors.onInsight, fontWeight: '700', fontSize: 15 }}>Myra</Text>
    </Pressable>
  );
}
