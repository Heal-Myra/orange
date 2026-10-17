import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { colors } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName, tint: string) => ({
  title,
  tabBarActiveTintColor: tint,
  tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={icon} size={size} color={color as string} />,
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.ink, fontWeight: '600' },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ ...tab('Today', 'sunny-outline', colors.accent), headerTitle: 'Project Heal' }} />
      <Tabs.Screen name="body" options={tab('Body', 'leaf-outline', colors.body)} />
      <Tabs.Screen name="mind" options={tab('Mind', 'bulb-outline', colors.mind)} />
      <Tabs.Screen name="soul" options={tab('Soul', 'flame-outline', colors.soul)} />
      <Tabs.Screen name="library" options={tab('Library', 'library-outline', colors.accent)} />
    </Tabs>
  );
}
