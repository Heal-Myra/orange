// The dark behind every screen (decision 0062; made calmer on 19 Nov 2026 after Oura): near-black with a faint dusk
// glow at the top. Each card brings its own soft colour wash (Card in ui.tsx).

import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { isGlass } from '../theme';

export function GlassBackdrop() {
  if (!isGlass) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#262B3D" />
            <Stop offset="0.35" stopColor="#17181F" />
            <Stop offset="1" stopColor="#121317" />
          </LinearGradient>
          <RadialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#C9825A" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#C9825A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#sky)" />
        <Circle cx="320" cy="40" r="220" fill="url(#sun)" />
      </Svg>
    </View>
  );
}
