// The sky behind every screen. Pastel look (decision 0065): each part of the app has its own soft colour, and it
// changes with that part's score (src/lib/livingColour.ts), easing over a few seconds so it never jumps.
// Ganga Dusk (decision 0062) keeps its plain dark with a faint dusk glow.

import { usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { sectionOf, skyFor, type Section } from '../lib/livingColour';
import { wellBeing } from '../lib/scoring';
import { spacesScore } from '../lib/spaces';
import { useHeal } from '../lib/store';
import { isGlass, isLight } from '../theme';

/** The score that drives a section's colour. */
export function useSectionScore(section: Section): number | null {
  const { day, profile } = useHeal();
  const w = wellBeing(day, profile);
  if (section === 'spaces') return spacesScore(profile.me?.spaces ?? {});
  if (section === 'today') return w.logged ? w.total : null;
  return w[section]?.total ?? null;
}

/** Eases a number towards its target over about two seconds. */
function useEased(target: number | null): number | null {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (target == null || cur.current == null) { cur.current = target; setV(target); return; }
    const from = cur.current, start = Date.now();
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - start) / 2000), e = 1 - (1 - k) ** 3;
      cur.current = from + (target - from) * e; setV(cur.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

export function LivingSky({ section, score, width, height, id = 'sky' }: { section: Section; score: number | null; width: number; height: number; id?: string }) {
  const sky = skyFor(section, score);
  const m = Math.max(width, height);
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={sky.stops[0]} /><Stop offset="0.55" stopColor={sky.stops[1]} /><Stop offset="1" stopColor={sky.stops[2]} />
        </LinearGradient>
        {sky.glows.map((g, i) => (
          <RadialGradient key={i} id={`${id}-r${i}`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={g.color} stopOpacity={g.opacity} /><Stop offset="1" stopColor={g.color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill={`url(#${id}-g)`} />
      {sky.glows.map((g, i) => g.rx
        ? <Ellipse key={i} cx={g.cx * width} cy={g.cy * height} rx={g.rx * width} ry={(g.ry ?? g.rx) * height} fill={`url(#${id}-r${i})`} />
        : g.r < 0.02
          ? <Circle key={i} cx={g.cx * width} cy={g.cy * height} r={Math.max(1.4, g.r * m)} fill={g.color} opacity={g.opacity} />
          : <Circle key={i} cx={g.cx * width} cy={g.cy * height} r={g.r * width} fill={`url(#${id}-r${i})`} />)}
    </Svg>
  );
}

export function GlassBackdrop() {
  const path = usePathname();
  const section = sectionOf(path);
  const score = useEased(useSectionScore(section));
  const { width, height } = useWindowDimensions();
  if (!isGlass) return null;
  if (isLight) return <View pointerEvents="none" style={StyleSheet.absoluteFill}><LivingSky section={section} score={score} width={width} height={height} /></View>;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#262B3D" /><Stop offset="0.35" stopColor="#17181F" /><Stop offset="1" stopColor="#121317" />
          </LinearGradient>
          <RadialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#C9825A" stopOpacity="0.22" /><Stop offset="1" stopColor="#C9825A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#sky)" />
        <Circle cx={width * 0.82} cy={40} r={220} fill="url(#sun)" />
      </Svg>
    </View>
  );
}
