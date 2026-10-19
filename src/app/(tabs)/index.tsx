// Today: the well-being circle (Body + Mind + Soul, out of 300) and today's guidance.
// The detail of each pillar lives on its own tab; tap a section of the circle to open it.

import { Text, View } from 'react-native';
import { GuidanceCard } from '../../components/AiBits';
import { PillarTiles, WellBeingRing } from '../../components/WellBeingRing';
import { useAuth } from '../../lib/auth';
import { Card, Note, Screen } from '../../components/ui';
import { band, wellBeing } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { colors } from '../../theme';

export default function Today() {
  const { day, profile } = useHeal();
  const { session } = useAuth();
  const w = wellBeing(day, profile);
  const label = w.logged ? band(w.total) : 'Nothing logged yet';
  const bandColor = w.total >= 180 ? colors.good : w.total >= 120 ? colors.warn : colors.bad;

  return (
    <Screen feedback="Today" top={
      <View style={{ paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 15, color: colors.muted }}>{greeting()},</Text>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink }}>{firstName(session?.user.email) ?? 'friend'}</Text>
      </View>
    }>

      <Card style={{ alignItems: 'center' }}>
        <WellBeingRing w={w} label={label} labelColor={w.logged ? bandColor : colors.muted} />
      </Card>

      <PillarTiles w={w} />

      <GuidanceCard />

      <View style={{ paddingHorizontal: 4 }}>
        <Note>Well-being = Body + Mind + Soul, each out of 100. A working model, not a medical measure.</Note>
      </View>
    </Screen>
  );
}

const greeting = () => {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 17 ? 'Good afternoon' : 'Good evening';
};

/** "santosh.jha01@gmail.com" → "Santosh". Letters before the first dot, number or underscore. */
const firstName = (email?: string | null): string | null => {
  const m = (email ?? '').split('@')[0].match(/^[a-zA-Z]+/);
  return m && m[0].length > 1 ? m[0][0].toUpperCase() + m[0].slice(1).toLowerCase() : null;
};
