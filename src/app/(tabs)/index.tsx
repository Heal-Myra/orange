// Today: the well-being circle (the average of Body, Mind and Soul, out of 100) and today's guidance.
// The detail of each pillar lives on its own tab; tap a section of the circle to open it.

import { Text, View } from 'react-native';
import { PillarRings, TodayRings } from '../../components/TodayRings';
import { MyraCard } from '../../components/MyraCard';
import { RecordsCard } from '../../components/RecordsCard';
import { FromYourDay } from '../../components/FromYourDay';
import { AirLine } from '../../components/AirLine';
import { SpacesNudge } from '../../components/SpacesNudge';
import { TodayHero } from '../../components/TodayHero';
import { YourDay } from '../../components/YourDay';
import { TodayFocus } from '../../components/TodayFocus';
import { todayISO } from '../../lib/dates';
import { useAuth } from '../../lib/auth';
import { Screen } from '../../components/ui';
import { wellBeing } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { colors, isGlass } from '../../theme';
import { tr } from '../../lib/i18n';

export default function Today() {
  const { day, date, profile } = useHeal();
  const { session } = useAuth();
  const w = wellBeing(day, profile);

  return (
    // No day row or greeting (founder, 31 Oct 2026): the page starts with the score; Myra speaks to the person by name.
    <Screen feedback="Today" fill>
      {/* AQI only on bad-air days; How I feel today moved to the Mind tab (founder, 31 Oct 2026). */}
      {date === todayISO() && !isGlass ? <View style={{ alignItems: 'center' }}><AirLine /></View> : null}

      {/* One design with the other cards (founder, 31 Oct 2026): rings for the best part and the three biggest concerns,
          the total in the middle, Myra recommends at the bottom; the three tiles open Body, Mind and Soul. */}
      {/* Oura-like redesign (decision 0063): the living scene, Body · Mind · Soul circles and one hero replace the rings cards. */}
      {isGlass ? <TodayHero w={w} /> : <TodayRings w={w} />}
      {date === todayISO() && isGlass ? <View style={{ alignItems: 'center' }}><AirLine /></View> : null}
      {/* Oura's order (founder, 22 Nov 2026): the score, the habit you are building, then the three parts needing the most attention. */}
      {/* Founder, 22 Nov 2026: Top of My Game right after the score, then the habit and the cards needing attention. */}
      {date === todayISO() && isGlass ? <RecordsCard /> : null}
      {date === todayISO() && isGlass ? <TodayFocus w={w} /> : null}

      {/* Back under the total (founder, 1 Nov 2026: the page looked too blank): Body, Mind and Soul with their parts. The tab
          icons keep their single score rings. */}
      {isGlass ? null : <PillarRings w={w} />}

      {/* NeoSapien (decision 0050): what Neo 1 heard today, ready to review; only when connected. */}
      {date === todayISO() ? <FromYourDay /> : null}

      {date === todayISO() && !isGlass ? <RecordsCard /> : null}

      {date === todayISO() ? <YourDay /> : null}

      <MyraCard />

      {/* Spaces (founder, 10 Nov 2026): Saturday and Sunday a home space, Friday the office desk. */}
      {date === todayISO() ? <SpacesNudge /> : null}


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
