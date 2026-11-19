// The floating tab bar (Oura-like redesign, 19 Nov 2026; decision 0063): a smoked-glass pill with Today, Body, Mind and
// Soul floating above the page, and a round ✦ button for Myra beside it, always one tap away.

import { Ionicons } from '@expo/vector-icons';
import { router, type Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  index: ['sunny-outline', 'sunny'], body: ['leaf-outline', 'leaf'], mind: ['bulb-outline', 'bulb'], soul: ['flame-outline', 'flame'],
};
const GLASS = { backgroundColor: '#1E2029', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' };

export function FloatingTabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name ?? 'index';
  const from = current === 'index' ? 'today' : current;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12) + 4, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <View style={[{ flex: 1, height: 64, borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }, GLASS]}>
        {state.routes.map((r, i) => {
          const on = state.index === i;
          const label = String(descriptors[r.key]?.options.title ?? r.name);
          const [off, onIcon] = ICONS[r.name] ?? ['ellipse-outline', 'ellipse'];
          return (
            <Pressable key={r.key} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label} hitSlop={6}
              onPress={() => {
                if (!on) navigateToTab(r.key);
              }}
              style={{ alignItems: 'center', gap: 2, minWidth: 56 }}>
              <Ionicons name={on ? onIcon : off} size={22} color={on ? colors.ink : colors.muted} />
              <Text style={{ fontSize: 11, fontWeight: on ? '600' : '500', color: on ? colors.ink : colors.muted }} numberOfLines={1}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable accessibilityLabel={tr('Ask Myra, your assistant')} onPress={() => router.push({ pathname: '/myra', params: { from } })}
        style={({ pressed }) => [{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }, GLASS]}>
        <Ionicons name="sparkles" size={24} color={colors.ink} />
      </Pressable>
    </View>
  );
}
