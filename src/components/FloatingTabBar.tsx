// The floating tab bar (Oura-like redesign, 19 Nov 2026; decision 0063): a smoked-glass pill with Today, Body, Mind and
// Soul floating above the page, and a round ✦ button for Myra beside it, always one tap away.

import { Ionicons } from '@expo/vector-icons';
import { router, type Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tr } from '../lib/i18n';
import { colors, glass, isLight } from '../theme';
import { SECTION } from '../lib/livingColour';
import { PillarIcon } from './PillarIcon';

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  index: ['sunny-outline', 'sunny'], body: ['leaf-outline', 'leaf'], mind: ['bulb-outline', 'bulb'], soul: ['flame-outline', 'flame'],
};
const GLASS = { backgroundColor: glass.nav, borderWidth: 1, borderColor: glass.line };

export function FloatingTabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name ?? 'index';
  const from = current === 'index' ? 'today' : current;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12) + 4, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <View style={[{ flex: 1, height: 64, borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', boxShadow: glass.shade }, GLASS]}>
        {state.routes.map((r, i) => {
          const on = state.index === i;
          const label = String(descriptors[r.key]?.options.title ?? r.name);
          const [off, onIcon] = ICONS[r.name] ?? ['ellipse-outline', 'ellipse'];
          // Pastel look: the tab you are on takes its section's colour (decision 0065).
          const tint = on ? (isLight ? SECTION[r.name === 'index' ? 'today' : (r.name as 'body' | 'mind' | 'soul')].word : colors.ink) : colors.muted;
          return (
            <Pressable key={r.key} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label} hitSlop={6}
              onPress={() => {
                if (!on) navigateToTab(r.key);
              }}
              style={{ alignItems: 'center', gap: 2, minWidth: 56 }}>
              {r.name === 'body' || r.name === 'mind' || r.name === 'soul'
                ? <PillarIcon pillar={r.name} size={24} color={tint} width={on ? 2 : 1.6} />
                : <Ionicons name={on ? onIcon : off} size={22} color={tint} />}
              <Text style={{ fontSize: 11, fontWeight: on ? '600' : '500', color: tint }} numberOfLines={1}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable accessibilityLabel={tr('Ask Myra, your assistant')} onPress={() => router.push({ pathname: '/myra', params: { from } })}
        style={({ pressed }) => [{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1, boxShadow: glass.shade }, GLASS]}>
        <Ionicons name="sparkles" size={24} color={colors.ink} />
      </Pressable>
    </View>
  );
}
