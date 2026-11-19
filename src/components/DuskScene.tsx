// The living scene at the top of Today (decision 0063, change 1): the Ganga as the day goes, drawn in code so there is
// nothing to license. Dawn, day, dusk and night skies; the far bank with temple spires; the river with the light's
// reflection; at dusk and night a few floating diyas. It fades into the page's dark at the bottom so cards stay clean.

import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

type Phase = 'dawn' | 'day' | 'dusk' | 'night';
export const phaseAt = (h: number): Phase => (h >= 5 && h < 9 ? 'dawn' : h >= 9 && h < 16 ? 'day' : h >= 16 && h < 19.5 ? 'dusk' : 'night');

export const SKY: Record<Phase, [string, string, string, string]> = {
  dawn: ['#2E3858', '#6E6680', '#C98E7A', '#E9B88E'],
  day: ['#2A4565', '#4F6F92', '#8FA9BF', '#C3CFD3'],
  dusk: ['#262A42', '#4E4664', '#93626A', '#D08A5E'],
  night: ['#12162A', '#1C2238', '#2B3150', '#3E3A5C'],
};
const GLOW: Record<Phase, string> = { dawn: '#FFD3A0', day: '#FFF4D6', dusk: '#FFB37A', night: '#DCE3FF' };

/** The scene, absolutely placed by the caller; `top` is the page's dark it fades into. */
export function DuskScene({ height, hour }: { height: number; hour: number }) {
  const p = phaseAt(hour);
  const [a, b, c, d] = SKY[p];
  const H = 620, horizon = 470; // the horizon sits low, under Myra's line, so the words stay on open sky
  const sunX = 70 + Math.max(0, Math.min(1, (hour - 5) / 15)) * 250; // the light travels across the sky with the day
  const lamps = p === 'dusk' || p === 'night';
  return (
    <Svg width="100%" height={height} viewBox={`0 0 390 ${H}`} preserveAspectRatio="xMidYMin slice">
      <Defs>
        <LinearGradient id="dsky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={a} /><Stop offset="0.45" stopColor={b} /><Stop offset="0.66" stopColor={c} /><Stop offset="0.76" stopColor={d} />
        </LinearGradient>
        <RadialGradient id="dglow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={GLOW[p]} stopOpacity="0.75" /><Stop offset="0.25" stopColor={GLOW[p]} stopOpacity="0.28" /><Stop offset="1" stopColor={GLOW[p]} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="driver" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={d} stopOpacity="0.55" /><Stop offset="0.5" stopColor={b} stopOpacity="0.45" /><Stop offset="1" stopColor={a} stopOpacity="0.3" />
        </LinearGradient>
        <LinearGradient id="dfade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.bg} stopOpacity="0" /><Stop offset="0.55" stopColor={colors.bg} stopOpacity="0.75" /><Stop offset="1" stopColor={colors.bg} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="390" height={H} fill="url(#dsky)" />
      <Circle cx={sunX} cy={horizon - 18} r="150" fill="url(#dglow)" />
      <Circle cx={sunX} cy={horizon - 18} r={p === 'night' ? 9 : 12} fill={GLOW[p]} opacity={p === 'day' ? 0.5 : 0.85} />
      {/* The far bank: low trees, ghat steps and three temple spires. */}
      <Path d={`M0 ${horizon} L0 ${horizon - 18} L22 ${horizon - 18} L28 ${horizon - 40} L32 ${horizon - 54} L36 ${horizon - 40} L42 ${horizon - 18} L58 ${horizon - 18} L63 ${horizon - 30} L66 ${horizon - 40} L69 ${horizon - 30} L74 ${horizon - 18} Q120 ${horizon - 24} 170 ${horizon - 15} T300 ${horizon - 16} L326 ${horizon - 18} L333 ${horizon - 36} L338 ${horizon - 50} L343 ${horizon - 36} L350 ${horizon - 18} L390 ${horizon - 20} L390 ${horizon} Z`}
        fill="#15171F" opacity={0.92} />
      <G opacity={0.5}>
        {[0, 1, 2].map(i => <Rect key={i} x={110 + i * 6} y={horizon - 8 + i * 3} width={170 - i * 12} height="2" fill="#2A2C36" />)}
      </G>
      {/* The river and the light's long reflection. */}
      <Rect x="0" y={horizon} width="390" height={H - horizon} fill="url(#driver)" />
      <Ellipse cx={sunX} cy={horizon + 50} rx="16" ry="48" fill={GLOW[p]} opacity={p === 'day' ? 0.12 : 0.22} />
      {[0, 1, 2, 3, 4].map(i => <Rect key={i} x={sunX - 30 + (i % 2) * 12} y={horizon + 14 + i * 18} width={44 - i * 4} height="1.5" fill={GLOW[p]} opacity={0.35} />)}
      {/* A small boat. */}
      <Path d={`M${300} ${horizon + 34} q22 8 44 0 l-6 6 q-16 4 -32 0 z`} fill="#121318" opacity={0.85} />
      {lamps ? [[60, horizon + 30], [96, horizon + 52], [140, horizon + 38], [250, horizon + 60], [330, horizon + 44]].map(([x, y], i) => (
        <G key={i}><Circle cx={x} cy={y} r="7" fill="#FFB060" opacity={0.18} /><Circle cx={x} cy={y} r="1.8" fill="#FFD08A" /></G>
      )) : null}
      <Rect x="0" y="0" width="390" height={H} fill="#0E0F14" opacity={0.28} />
      <Rect x="0" y={H * 0.62} width="390" height={H * 0.38} fill="url(#dfade)" />
    </Svg>
  );
}
