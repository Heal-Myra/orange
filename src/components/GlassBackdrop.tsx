// The Ganga Dusk scene behind every screen (decision 0062): an evening sky over soft river hills, drawn as shapes so it
// is light and sharp on every phone. Cards sit on it like smoked glass.

import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { isGlass } from '../theme';

export function GlassBackdrop() {
  if (!isGlass) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2E3A5C" />
            <Stop offset="0.42" stopColor="#7A5A63" />
            <Stop offset="0.62" stopColor="#C9825A" />
            <Stop offset="1" stopColor="#1B1A22" />
          </LinearGradient>
          <RadialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#F7C27A" stopOpacity="0.95" />
            <Stop offset="1" stopColor="#F7C27A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#sky)" />
        <Circle cx="300" cy="300" r="90" fill="url(#sun)" />
        <Ellipse cx="140" cy="520" rx="260" ry="120" fill="#5A4A44" opacity="0.9" />
        <Ellipse cx="350" cy="560" rx="240" ry="140" fill="#3E3532" />
        <Ellipse cx="190" cy="760" rx="320" ry="220" fill="#16151B" />
      </Svg>
    </View>
  );
}
