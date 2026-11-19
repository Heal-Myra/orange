// Happy Orange's own marks for the three pillars (founder, 19 Nov 2026: "there is a logo for each … let's design that"),
// thin line drawings like Oura's: Body, a person rising like a sprouting plant (nature first); Mind, still water with
// two soft ripples (a settled mind); Soul, a diya, the lamp lit at the Ganga each evening.

import Svg, { Circle, Path } from 'react-native-svg';

export type PillarId = 'body' | 'mind' | 'soul';

export function PillarIcon({ pillar, size = 18, color = '#FFFFFF', width = 1.6 }: { pillar: PillarId; size?: number; color?: string; width?: number }) {
  const p = { stroke: color, strokeWidth: width, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {pillar === 'body' ? (
        <>
          <Circle cx="12" cy="4.6" r="2" {...p} />
          <Path d="M12 8.6 V21" {...p} />
          <Path d="M12 14 C8.2 14 5.6 11.6 5.2 8.2 C8.6 8.4 11.2 10.6 12 14 Z" {...p} />
          <Path d="M12 12 C15.8 12 18.4 9.6 18.8 6.2 C15.4 6.4 12.8 8.6 12 12 Z" {...p} />
        </>
      ) : pillar === 'mind' ? (
        <>
          <Circle cx="12" cy="12" r="1.6" {...p} />
          <Path d="M7.2 9.4 A5.4 5.4 0 0 1 16.8 9.4 M16.8 14.6 A5.4 5.4 0 0 1 7.2 14.6" {...p} />
          <Path d="M3.6 8.6 A9 9 0 0 1 20.4 8.6 M20.4 15.4 A9 9 0 0 1 3.6 15.4" {...p} opacity={0.75} />
        </>
      ) : (
        <>
          <Path d="M12 3.2 C14.4 6.2 15.2 8.6 12 12.4 C8.8 8.6 9.6 6.2 12 3.2 Z" {...p} />
          <Path d="M3.5 14.6 H20.5 C19.6 18.4 16.2 20.6 12 20.6 C7.8 20.6 4.4 18.4 3.5 14.6 Z" {...p} />
          <Path d="M17.6 14.6 L20.8 12.8" {...p} />
        </>
      )}
    </Svg>
  );
}
