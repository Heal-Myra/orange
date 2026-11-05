import type React from 'react';
// To do / Done switch for to-dos, and the unicorn that flies up the screen when one is done (founder, 5 Nov 2026).
// The unicorn layer sits once over the whole app (root layout) and never takes taps.

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

type Fly = { id: number; x: number; y: number };
let listener: ((f: Fly) => void) | null = null;
let nextId = 1;
/** Send a unicorn up the screen from this point (window coordinates). */
export const flyUnicorn = (x: number, y: number) => listener?.({ id: nextId++, x, y });

const native = Platform.OS !== 'web';
const W = 86, H = 34, KNOB = 28;

/** The switch: slide (or tap) to Done; slide back to undo. */
export function DoneSwitch({ done, onDone, onUndo, label }: { done: boolean; onDone: () => void; onUndo?: () => void; label: string }) {
  const pos = useRef(new Animated.Value(done ? 1 : 0)).current;
  const ref = useRef<React.ComponentRef<typeof View>>(null);
  useEffect(() => { Animated.timing(pos, { toValue: done ? 1 : 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(); }, [done, pos]);
  const press = () => {
    if (done) { onUndo?.(); return; }
    Animated.timing(pos, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
    ref.current?.measureInWindow((x: number, y: number) => flyUnicorn(x + W - KNOB, y - 10));
    setTimeout(onDone, 260); // let the knob slide before the row changes
  };
  const left = pos.interpolate({ inputRange: [0, 1], outputRange: [3, W - KNOB - 3] });
  const bg = pos.interpolate({ inputRange: [0, 1], outputRange: ['#E6ECEE', colors.accent] });
  return (
    <Pressable ref={ref} onPress={press} accessibilityRole="switch" accessibilityState={{ checked: done }} accessibilityLabel={label} hitSlop={8}>
      <Animated.View style={{ width: W, height: H, borderRadius: H / 2, backgroundColor: bg, justifyContent: 'center' }}>
        <Text style={{ position: 'absolute', fontSize: 12, fontWeight: '700', ...(done ? { left: 11, color: '#fff' } : { right: 11, color: colors.muted }) }}>
          {done ? tr('Done') : tr('To do')}
        </Text>
        <Animated.View style={{ position: 'absolute', left, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
      </Animated.View>
    </Pressable>
  );
}

/** Over the whole app: each unicorn curves up and away with a sparkle trail (about 1.6 s). */
export function UnicornLayer() {
  const [flies, setFlies] = useState<Fly[]>([]);
  useEffect(() => { listener = f => setFlies(l => [...l, f]); return () => { listener = null; }; }, []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {flies.map(f => <Unicorn key={f.id} f={f} onEnd={() => setFlies(l => l.filter(x => x.id !== f.id))} />)}
    </View>
  );
}

function Unicorn({ f, onEnd }: { f: Fly; onEnd: () => void }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 1600, easing: Easing.in(Easing.quad), useNativeDriver: native }).start(onEnd);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const rise = f.y + 80; // until it is above the top of the screen
  const y = t.interpolate({ inputRange: [0, 1], outputRange: [0, -rise] });
  const x = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -50, -90] }); // a gentle curve to the left
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-14deg'] });
  const scale = t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.4, 1.1, 0.9] });
  return (
    <>
      {[0.12, 0.22, 0.32, 0.42, 0.52].map((lag, k) => {
        // Sparkles follow the same path a little behind, fading out.
        const tt = t.interpolate({ inputRange: [0, lag, 1], outputRange: [0, 0, 1 - lag], extrapolate: 'clamp' });
        return (
          <Animated.Text key={k} style={{ position: 'absolute', left: f.x + 22 + (k % 2 ? 10 : -4), top: f.y + 40, fontSize: 14 - k, color: '#E0A84F',
            opacity: t.interpolate({ inputRange: [0, lag, lag + 0.05, 1], outputRange: [0, 0, 1, 0] }),
            transform: [{ translateY: tt.interpolate({ inputRange: [0, 1], outputRange: [0, -rise] }) }, { translateX: tt.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -50, -90] }) }] }}>
            {k % 2 ? '✧' : '✦'}
          </Animated.Text>
        );
      })}
      <Animated.Text style={{ position: 'absolute', left: f.x, top: f.y, fontSize: 44, transform: [{ translateY: y }, { translateX: x }, { rotate }, { scale }] }}>🦄</Animated.Text>
    </>
  );
}
