// Body, Mind and Soul tabs (founder, 31 Oct 2026, option B): the familiar icon inside one thin ring that fills with that
// pillar's score for the day on screen, so the scores are visible from every page. Replaces the three circles on Today.

import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { wellBeing } from '../lib/scoring';
import { useHeal } from '../lib/store';
import { PASTEL } from './Rings';

const RING = { body: PASTEL.sage, mind: PASTEL.teal, soul: PASTEL.peach } as const;

export function TabRing({ pillar, icon, color }: { pillar: 'body' | 'mind' | 'soul'; icon: ComponentProps<typeof Ionicons>['name']; color: string }) {
  const { day, profile } = useHeal();
  const w = wellBeing(day, profile);
  const v = Math.max(0, Math.min(1, (w[pillar]?.total ?? 0) / 100));
  const S = 32, sw = 2.4, r = (S - sw) / 2, c = 2 * Math.PI * r;
  return (
    <View style={{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={S} height={S} style={{ position: 'absolute' }}>
        <Circle cx={S / 2} cy={S / 2} r={r} stroke={RING[pillar] + '38'} strokeWidth={sw} fill="none" />
        {v > 0 ? <Circle cx={S / 2} cy={S / 2} r={r} stroke={RING[pillar]} strokeWidth={sw} fill="none" strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`} transform={`rotate(-90 ${S / 2} ${S / 2})`} /> : null}
      </Svg>
      <Ionicons name={icon} size={17} color={color} />
    </View>
  );
}
