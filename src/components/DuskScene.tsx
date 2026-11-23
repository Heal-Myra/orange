// The living scene at the top of Today (decision 0063, change 1): the Ganga as the day goes, drawn in code so there is
// nothing to license. Dawn, day, dusk and night skies; the far bank with temple spires; the river with the light's
// reflection; at dusk and night a few floating diyas. It fades into the page's dark at the bottom so cards stay clean.

import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

/** The sky through the day (founder, 23 Nov 2026: "change the sky color as the day progresses", like Oura's morning
 *  blue). Key moments, blended smoothly in between: night, pink dawn, clear morning blue, bright midday, warm afternoon,
 *  dusk, twilight, night again. Each: four sky tones top to horizon, the light's colour, and how much cloud and stars. */
interface Key { h: number; sky: [string, string, string, string]; glow: string; veil: number; clouds: number; stars: number }
const KEYS: Key[] = [
  { h: 0, sky: ['#10142A', '#1A2038', '#283050', '#3A385A'], glow: '#DCE3FF', veil: 0.28, clouds: 0, stars: 1 },
  { h: 4.8, sky: ['#141A34', '#232A48', '#38405E', '#4E4A68'], glow: '#DCE3FF', veil: 0.28, clouds: 0, stars: 0.8 },
  { h: 6.2, sky: ['#34406A', '#6E7298', '#D29884', '#F0C49C'], glow: '#FFD3A0', veil: 0.2, clouds: 0.15, stars: 0 },
  { h: 8, sky: ['#2C5B85', '#4F7DA6', '#86A8C4', '#BCD0DC'],  // Oura's morning blue (founder, 23 Nov 2026)
    glow: '#FFF1D6', veil: 0.14, clouds: 0.5, stars: 0 },
  { h: 12.5, sky: ['#336A9C', '#5A8EBE', '#9CC0DC', '#D8E7F0'], glow: '#FFF8E6', veil: 0.14, clouds: 0.45, stars: 0 },
  { h: 16, sky: ['#335E8C', '#6584AE', '#B2B6C8', '#E6CFB4'], glow: '#FFE2B8', veil: 0.16, clouds: 0.3, stars: 0 },
  { h: 18, sky: ['#262A42', '#4E4664', '#93626A', '#D08A5E'], glow: '#FFB37A', veil: 0.24, clouds: 0.1, stars: 0 },
  { h: 19.6, sky: ['#1A1F3C', '#2F3356', '#564868', '#74586A'], glow: '#F2A27A', veil: 0.28, clouds: 0, stars: 0.4 },
  { h: 21, sky: ['#10142A', '#1A2038', '#283050', '#3A385A'], glow: '#DCE3FF', veil: 0.28, clouds: 0, stars: 1 },
  { h: 24, sky: ['#10142A', '#1A2038', '#283050', '#3A385A'], glow: '#DCE3FF', veil: 0.28, clouds: 0, stars: 1 },
];
const hx = (x: string) => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
const blend = (a: string, b: string, t: number) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
export function skyAt(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const i = Math.max(0, KEYS.findIndex(k => k.h > h) - 1);
  const A = KEYS[i], B = KEYS[i + 1] ?? KEYS[i];
  const t = B.h === A.h ? 0 : (h - A.h) / (B.h - A.h);
  return {
    sky: A.sky.map((c, j) => blend(c, B.sky[j], t)) as [string, string, string, string],
    glow: blend(A.glow, B.glow, t), veil: A.veil + (B.veil - A.veil) * t,
    clouds: A.clouds + (B.clouds - A.clouds) * t, stars: A.stars + (B.stars - A.stars) * t,
    night: h >= 20.5 || h < 5, lamps: h >= 17.5 || h < 5.5,
  };
}

const STARS: [number, number, number][] = [[30, 40, 1.2], [80, 90, 0.9], [140, 30, 1.4], [200, 70, 1], [260, 25, 1.1], [320, 80, 1.3], [360, 40, 0.9], [110, 150, 1], [230, 140, 0.8], [300, 180, 1.1], [50, 210, 0.9], [175, 230, 1.2]];
const CLOUDS: [number, number, number][] = [[20, 215, 55], [372, 240, 60], [345, 448, 42]];

/** The scene, absolutely placed by the caller; `top` is the page's dark it fades into. */
export function DuskScene({ height, hour, width, pastel }: { height: number; hour: number; width: number; pastel?: boolean }) {
  if (pastel) return <PastelBank width={width} height={height} />;
  const k = skyAt(hour);
  const [a, b, c, d] = k.sky;
  const glow = k.glow;
  const H = 620, horizon = 500; // the horizon sits low, under Myra's line, so the words stay on open sky
  const sunX = 70 + Math.max(0, Math.min(1, (hour - 5) / 15)) * 250; // the light travels across the sky with the day
  const lamps = k.lamps;
  return (
    <Svg width={width} height={height} viewBox={`0 0 390 ${H}`} preserveAspectRatio="xMidYMin slice">
      <Defs>
        <LinearGradient id="dsky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={a} /><Stop offset="0.45" stopColor={b} /><Stop offset="0.66" stopColor={c} /><Stop offset="0.76" stopColor={d} />
        </LinearGradient>
        <RadialGradient id="dglow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={glow} stopOpacity="0.75" /><Stop offset="0.25" stopColor={glow} stopOpacity="0.28" /><Stop offset="1" stopColor={glow} stopOpacity="0" />
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
      <Circle cx={sunX} cy={horizon - 18} r={k.night ? 9 : 12} fill={glow} opacity={k.clouds > 0.3 ? 0.55 : 0.85} />
      {/* Stars at night, soft clouds by day. */}
      {k.stars > 0.05 ? STARS.map(([x, y, r], i) => <Circle key={`s${i}`} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={k.stars * (0.35 + (i % 3) * 0.2)} />) : null}
      {k.clouds > 0.05 ? CLOUDS.map(([x, y, w], i) => (
        <G key={`c${i}`} opacity={k.clouds}>
          <Ellipse cx={x} cy={y} rx={w} ry={w * 0.22} fill="#FFFFFF" opacity={0.55} />
          <Ellipse cx={x - w * 0.35} cy={y + 4} rx={w * 0.55} ry={w * 0.18} fill="#FFFFFF" opacity={0.45} />
          <Ellipse cx={x + w * 0.4} cy={y + 5} rx={w * 0.5} ry={w * 0.16} fill="#FFFFFF" opacity={0.4} />
        </G>
      )) : null}
      {/* The far bank: low trees, ghat steps and three temple spires. */}
      <Path d={`M0 ${horizon} L0 ${horizon - 18} L22 ${horizon - 18} L28 ${horizon - 40} L32 ${horizon - 54} L36 ${horizon - 40} L42 ${horizon - 18} L58 ${horizon - 18} L63 ${horizon - 30} L66 ${horizon - 40} L69 ${horizon - 30} L74 ${horizon - 18} Q120 ${horizon - 24} 170 ${horizon - 15} T300 ${horizon - 16} L326 ${horizon - 18} L333 ${horizon - 36} L338 ${horizon - 50} L343 ${horizon - 36} L350 ${horizon - 18} L390 ${horizon - 20} L390 ${horizon} Z`}
        fill="#15171F" opacity={0.92} />
      <G opacity={0.5}>
        {[0, 1, 2].map(i => <Rect key={i} x={110 + i * 6} y={horizon - 8 + i * 3} width={170 - i * 12} height="2" fill="#2A2C36" />)}
      </G>
      {/* The river and the light's long reflection. */}
      <Rect x="0" y={horizon} width="390" height={H - horizon} fill="url(#driver)" />
      <Ellipse cx={sunX} cy={horizon + 50} rx="16" ry="48" fill={glow} opacity={k.clouds > 0.3 ? 0.12 : 0.22} />
      {[0, 1, 2, 3, 4].map(i => <Rect key={i} x={sunX - 30 + (i % 2) * 12} y={horizon + 14 + i * 18} width={44 - i * 4} height="1.5" fill={glow} opacity={0.35} />)}
      {/* A small boat. */}
      <Path d={`M${300} ${horizon + 34} q22 8 44 0 l-6 6 q-16 4 -32 0 z`} fill="#121318" opacity={0.85} />
      {lamps ? [[60, horizon + 30], [96, horizon + 52], [140, horizon + 38], [250, horizon + 60], [330, horizon + 44]].map(([x, y], i) => (
        <G key={i}><Circle cx={x} cy={y} r="7" fill="#FFB060" opacity={0.18} /><Circle cx={x} cy={y} r="1.8" fill="#FFD08A" /></G>
      )) : null}
      <Rect x="0" y="0" width="390" height={H} fill="#0E0F14" opacity={k.veil} />
      <Rect x="0" y={H * 0.62} width="390" height={H * 0.38} fill="url(#dfade)" />
    </Svg>
  );
}

/** Pastel look (decision 0065): the sky is the living Today sky behind the screen, so only the far bank with its temple
 *  spires and a soft river are drawn here, in peach tones that fade away below. */
function PastelBank({ width, height }: { width: number; height: number }) {
  const H = 620, horizon = 500;
  return (
    <Svg width={width} height={height} viewBox={`0 0 390 ${H}`} preserveAspectRatio="xMidYMin slice">
      <Defs>
        <LinearGradient id="pr" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F4D9CF" stopOpacity="0.9" /><Stop offset="1" stopColor="#FCEEE6" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={`M0 ${horizon} L0 ${horizon - 18} L22 ${horizon - 18} L28 ${horizon - 40} L32 ${horizon - 54} L36 ${horizon - 40} L42 ${horizon - 18} L58 ${horizon - 18} L63 ${horizon - 30} L66 ${horizon - 40} L69 ${horizon - 30} L74 ${horizon - 18} Q120 ${horizon - 24} 170 ${horizon - 15} T300 ${horizon - 16} L326 ${horizon - 18} L333 ${horizon - 36} L338 ${horizon - 50} L343 ${horizon - 36} L350 ${horizon - 18} L390 ${horizon - 20} L390 ${horizon} Z`}
        fill="#D9A99A" opacity={0.5} />
      <Rect x="0" y={horizon} width="390" height={H - horizon} fill="url(#pr)" />
      <Path d={`M300 ${horizon + 34} q22 8 44 0 l-6 6 q-16 4 -32 0 z`} fill="#C99A8C" opacity={0.5} />
    </Svg>
  );
}

/** The colour at the very top of the scene, after its calm veil: the Today header takes it so the sky runs up unbroken. */
export function skyTop(hour: number) { const k = skyAt(hour); return blend(k.sky[0], '#0E0F14', k.veil); }
