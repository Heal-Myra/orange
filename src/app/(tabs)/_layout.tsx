import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MyraButton } from '../../components/MyraButton';
import { FloatingTabBar } from '../../components/FloatingTabBar';
import { TabRing } from '../../components/TabRing';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { colors, glass, isGlass } from '../../theme';
import { tr } from '../../lib/i18n';
import { usePendingRequests } from '../../lib/adminAlerts';
import { useHeal } from '../../lib/store';
import { useAuth } from '../../lib/auth';
import { wellBeing } from '../../lib/scoring';
import { Score } from '../../components/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName, tint: string) => ({
  title,
  tabBarActiveTintColor: isGlass ? colors.ink : tint,
  tabBarIcon: ({ color }: { color: ColorValue }) => <Ionicons name={icon} size={28} color={color as string} />,
});

/** The pillar's score in the title bar, on the right (founder, 4 Nov 2026). */
function PillarScore({ pillar }: { pillar: 'body' | 'mind' | 'soul' }) {
  const { day, profile } = useHeal();
  const w = wellBeing(day, profile);
  return <View style={{ paddingHorizontal: 16 }}><Score value={w[pillar]?.total} max={100} /></View>;
}

const ringTab = (title: string, pillar: 'body' | 'mind' | 'soul', icon: IconName, tint: string) => ({
  title,
  headerRight: () => <PillarScore pillar={pillar} />,
  tabBarActiveTintColor: isGlass ? colors.ink : tint,
  tabBarIcon: ({ color }: { color: ColorValue }) => <TabRing pillar={pillar} icon={icon} color={color as string} />,
});

/** Profile, with a small dot when AI access requests are waiting for an admin (admins only). */
function ProfileButton() {
  const pending = usePendingRequests();
  // The person's first name in place of the word "Profile" (founder, 31 Oct 2026).
  const { profile } = useHeal();
  const { session } = useAuth();
  const mail = (session?.user.email ?? '').split('@')[0].match(/^[a-zA-Z]+/)?.[0] ?? '';
  const name = profile.me?.name?.trim().split(/\s+/)[0] || (mail.length > 1 ? mail[0].toUpperCase() + mail.slice(1).toLowerCase() : '') || tr('Profile');
  return (
    <Link href="/account" asChild>
      <Pressable accessibilityLabel={pending ? tr('Profile, {n} requests waiting', { n: pending }) : tr('Profile')} hitSlop={10} style={{ paddingHorizontal: 16, alignItems: 'center' }}>
        <View style={isGlass ? { width: 40, height: 40, borderRadius: 20, backgroundColor: glass.fill, alignItems: 'center', justifyContent: 'center' } : undefined}>
          {/* Glass look: the first letter of the name in a glass circle, like Oura's round header buttons (19 Nov 2026). */}
          {isGlass && name !== tr('Profile') ? <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '500' }}>{name.charAt(0).toUpperCase()}</Text>
            : <Ionicons name={isGlass ? 'person-outline' : 'person-circle-outline'} size={isGlass ? 20 : 30} color={colors.ink} />}
          {pending > 0 && <View style={{ position: 'absolute', top: 1, right: 0, width: 11, height: 11, borderRadius: 6, backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.bg }} />}
        </View>
        {isGlass ? null : <Text style={{ fontSize: 12, fontWeight: '600', color: colors.ink, maxWidth: 80 }} numberOfLines={1}>{name}</Text>}
      </Pressable>
    </Link>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      tabBar={isGlass ? props => <FloatingTabBar {...props} /> : undefined}
      screenOptions={{
        // Glass looks: every tab's header is see-through so its sky runs to the top (decision 0065).
        ...(isGlass ? { headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } } : { headerStyle: { backgroundColor: colors.bg } }),
        headerShadowVisible: false,
        headerTitleStyle: isGlass ? { color: colors.ink, fontWeight: '500', fontSize: 17 } : { color: colors.ink, fontWeight: '600' },
        headerTitleAlign: isGlass ? 'center' : undefined,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 72 + insets.bottom, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600', marginTop: 2 }, // bigger, easier to read (founder, 19 Oct 2026)
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ ...tab(tr('Today'), 'sunny-outline', colors.accent),
        // The header takes the top colour of Today's living scene so the two read as one sky (decision 0063).
        // The living scene runs up behind a see-through header, like Oura's (founder, 19 Nov 2026).
        ...(isGlass ? { headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } } : {}), headerTitle: isGlass ? 'HAPPY ORANGE' : 'Happy Orange', headerTitleStyle: isGlass ? { color: colors.ink, fontWeight: '500', fontSize: 15, letterSpacing: 3 } : { color: colors.brand, fontWeight: '700' },
        headerRight: () => <ProfileButton /> }} />
      {/* Each icon sits in a thin ring that fills with that pillar's score (founder, 31 Oct 2026, option B). */}
      <Tabs.Screen name="body" options={ringTab(tr('Body'), 'body', 'leaf-outline', colors.body)} />
      <Tabs.Screen name="mind" options={ringTab(tr('Mind'), 'mind', 'bulb-outline', colors.mind)} />
      <Tabs.Screen name="soul" options={ringTab(tr('Soul'), 'soul', 'flame-outline', colors.soul)} />
    </Tabs>
    {isGlass ? null : <MyraButton />}
    </View>
  );
}
