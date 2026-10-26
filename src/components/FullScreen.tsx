// Full-screen pages (guided breathing, explainers, Yoga Nidra, cooking guide) keep clear of the iPhone's status bar.
// SafeAreaView inside a full-screen modal sometimes reports no top inset, so the header ran into the clock and battery
// (founder, 26 Oct 2026). This reads the insets directly and falls back to a safe height when they are missing.
import type { ReactNode } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

export function FullScreen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets();
  const fallbackTop = initialWindowMetrics?.insets.top || (Platform.OS === 'ios' ? 54 : 24);
  const top = insets.top || fallbackTop;
  const bottom = insets.bottom || initialWindowMetrics?.insets.bottom || 0;
  return <View style={[{ flex: 1, paddingTop: top, paddingBottom: bottom }, style]}>{children}</View>;
}
