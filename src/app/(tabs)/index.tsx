// Today: the well-being score (Body + Mind + Soul, out of 300) and what makes it up.

import { Text, View } from 'react-native';
import { GuidanceCard } from '../../components/AiBits';
import { WellBeingRing } from '../../components/WellBeingRing';
import { Card, Heading, Meter, Note, Screen, Score, s } from '../../components/ui';
import { band, wellBeing } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { colors } from '../../theme';

export default function Today() {
  const { day, profile } = useHeal();
  const w = wellBeing(day, profile);
  const label = w.logged ? band(w.total) : 'Nothing logged yet';
  const bandColor = w.total >= 180 ? colors.good : w.total >= 120 ? colors.warn : colors.bad;

  return (
    <Screen>
      <Card style={{ alignItems: 'center', gap: 4 }}>
        <WellBeingRing w={w} label={label} labelColor={w.logged ? bandColor : colors.muted} />
      </Card>

      <GuidanceCard />

      <Card>
        <Heading right={<Score value={w.body?.total} max={100} />}>Body</Heading>
        {w.body ? (
          <>
            <Meter label="Movement" value={w.body.movement} max={40} color={colors.body} />
            <Meter label="Sleep" value={w.body.sleep} max={30} color={colors.body} />
            <Meter label="Food" value={w.body.nutrition} max={30} color={colors.body} />
          </>
        ) : <Note>Add your steps, sleep or a meal in the Body tab.</Note>}
      </Card>

      <Card>
        <Heading right={<Score value={w.mind?.total} max={100} />}>Mind</Heading>
        {w.mind ? (
          <>
            <Meter label="Meditation, attention, learning" value={w.mind.practices} max={40} color={colors.mind} />
            <Meter label="Content diet" value={w.mind.content ?? 0} max={60} color={colors.mind}
              right={w.mind.content == null ? 'not logged' : `${Math.round(w.mind.content)} / 60`} />
          </>
        ) : <Note>Log meditation, focus, learning or social-media time in the Mind tab.</Note>}
      </Card>

      <Card>
        <Heading right={<Score value={w.soul?.total} max={100} />}>Soul</Heading>
        {w.soul ? (
          <Meter label={`${w.soul.count} of 8 practices kept`} value={w.soul.total} max={100} color={colors.soul} />
        ) : <Note>Tick the practices you kept today in the Soul tab.</Note>}
      </Card>

      <View style={{ paddingHorizontal: 4 }}>
        <Note>Your well-being score is Body + Mind + Soul, each out of 100. It is a working model to help you understand yourself, not a medical measure.</Note>
      </View>
    </Screen>
  );
}
