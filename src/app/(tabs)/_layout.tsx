import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MyraButton } from '../../components/MyraButton';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { colors } from '../../theme';
import { tr } from '../../lib/i18n';
import { usePendingRequests } from '../../lib/adminAlerts';

type IconName = ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName, tint: string) => ({
  title,
  tabBarActiveTintColor: tint,
  tabBarIcon: ({ color }: { color: ColorValue }) => <Ionicons name={icon} size={28} color={color as string} />,
});

/** Profile, with a small dot when AI access requests are waiting for an admin (admins only). */
function ProfileButton() {
  const pending = usePendingRequests();
  return (
    <Link href="/account" asChild>
      <Pressable accessibilityLabel={pending ? tr('Profile, {n} requests waiting', { n: pending }) : tr('Profile')} hitSlop={10} style={{ paddingHorizontal: 16, alignItems: 'center' }}>
        <View>
          <Ionicons name="person-circle-outline" size={30} color={colors.ink} />
          {pending > 0 && <View style={{ position: 'absolute', top: 1, right: 0, width: 11, height: 11, borderRadius: 6, backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.bg }} />}
        </View>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.ink }}>{tr('Profile')}</Text>
      </Pressable>
    </Link>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.ink, fontWeight: '600' },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 68 + insets.bottom, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600', marginTop: 2 }, // bigger, easier to read (founder, 19 Oct 2026)
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ ...tab(tr('Today'), 'sunny-outline', colors.accent), headerTitle: 'Happy Orange', headerTitleStyle: { color: colors.brand, fontWeight: '700' },
        headerRight: () => <ProfileButton /> }} />
      <Tabs.Screen name="body" options={tab(tr('Body'), 'leaf-outline', colors.body)} />
      <Tabs.Screen name="mind" options={tab(tr('Mind'), 'bulb-outline', colors.mind)} />
      <Tabs.Screen name="soul" options={tab(tr('Soul'), 'flame-outline', colors.soul)} />
    </Tabs>
    <MyraButton />
    </View>
  );
}
