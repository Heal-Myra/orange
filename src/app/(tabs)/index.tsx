// Today: the well-being circle (Body + Mind + Soul, out of 300) and today's guidance.
// The detail of each pillar lives on its own tab; tap a section of the circle to open it.

import { View } from 'react-native';
import { GuidanceCard } from '../../components/AiBits';
import { WellBeingRing } from '../../components/WellBeingRing';
import { Card, Note, Screen } from '../../components/ui';
import { band, wellBeing } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { colors } from '../../theme';

export default function Today() {
  const { day, profile } = useHeal();
  const w = wellBeing(day, profile);
  const label = w.logged ? band(w.total) : 'Nothing logged yet';
  const bandColor = w.total >= 180 ? colors.good : w.total >= 120 ? colors.warn : colors.bad;

  return (
    <Screen feedback="Today">
      <Card style={{ alignItems: 'center' }}>
        <WellBeingRing w={w} label={label} labelColor={w.logged ? bandColor : colors.muted} />
      </Card>

      <GuidanceCard />

      <View style={{ paddingHorizontal: 4 }}>
        <Note>Your well-being score is Body + Mind + Soul, each out of 100. It is a working model to help you understand yourself, not a medical measure.</Note>
      </View>
    </Screen>
  );
}
