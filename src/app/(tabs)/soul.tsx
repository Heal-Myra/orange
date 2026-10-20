// Soul / inner life: study the Gita verse of the day, the thought of the day, gratitude,
// the Tao practice on Soul days, and one simple check for the eight practices (led by truthfulness and fairness).

import { GratitudeCard, PracticesCheck, ThoughtCard, VerseStudyCard } from '../../components/SoulCards';
import { MeditationTimer } from '../../components/MeditationTimer';
import { TaoCard } from '../../components/TaoCard';
import { Card, Heading, Screen, Score } from '../../components/ui';
import { soulScore } from '../../lib/scoring';
import { useHeal } from '../../lib/store';

export default function Soul() {
  const { day, profile } = useHeal();
  const score = soulScore(day, profile);
  return (
    <Screen feedback="Soul">
      <Card style={{ paddingVertical: 12 }}>
        <Heading right={<Score value={score?.total} max={100} />}>Soul today</Heading>
      </Card>
      <VerseStudyCard />
      <MeditationTimer />
      <ThoughtCard />
      <GratitudeCard />
      <TaoCard on="soul" />
      <PracticesCheck />
    </Screen>
  );
}
