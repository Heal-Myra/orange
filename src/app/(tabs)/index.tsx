// Today: the well-being circle (Body + Mind + Soul, out of 300) and today's guidance.
// The detail of each pillar lives on its own tab; tap a section of the circle to open it.

import { Text, View } from 'react-native';
import { PillarRings, TodayRings } from '../../components/TodayRings';
import { MyraCard } from '../../components/MyraCard';
import { FeelingCard } from '../../components/FeelingCard';
import { AirLine } from '../../components/AirLine';
import { todayISO } from '../../lib/dates';
import { useAuth } from '../../lib/auth';
import { Note, Screen } from '../../components/ui';
import { wellBeing } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { colors } from '../../theme';
import { tr } from '../../lib/i18n';

export default function Today() {
  const { day, date, profile } = useHeal();
  const { session } = useAuth();
  const w = wellBeing(day, profile);

  return (
    <Screen feedback="Today" trends="today" top={
      <View style={{ paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 15, color: colors.muted }}>{greeting()},</Text>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink }}>{profile.me?.name?.split(' ')[0] || firstName(session?.user.email) || tr('friend')}</Text>
        {date === todayISO() ? <AirLine /> : null}
      </View>
    }>

      {date === todayISO() ? <FeelingCard /> : null}

      {/* One design with the other cards (founder, 31 Oct 2026): rings for the best part and the three biggest concerns,
          the total in the middle, Myra recommends at the bottom; the three tiles open Body, Mind and Soul. */}
      <TodayRings w={w} />

      <PillarRings w={w} />

      <MyraCard />

      <View style={{ paddingHorizontal: 4 }}>
        <Note>{tr('Well-being = Body + Mind + Soul, each out of 100. A working model, not a medical measure.')}</Note>
      </View>

      {/* The Care plan card was removed (founder, 26 Oct 2026): care shows only inside Food, Sleep and Movement, and as
          the care breathing session; the see-a-doctor line sits under How I feel today. */}
    </Screen>
  );
}

const greeting = () => {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? tr('Good morning') : h >= 12 && h < 17 ? tr('Good afternoon') : tr('Good evening');
};

/** "santosh.jha01@gmail.com" → "Santosh". Letters before the first dot, number or underscore. */
const firstName = (email?: string | null): string | null => {
  const m = (email ?? '').split('@')[0].match(/^[a-zA-Z]+/);
  return m && m[0].length > 1 ? m[0][0].toUpperCase() + m[0].slice(1).toLowerCase() : null;
};
