// Myra's nudge written by a quill (founder, 31 Oct 2026, option 1: quill, Kalam Light): the ink appears just behind the
// tip, line by line, like a diary that writes by itself. Each text is written once per app session (when Myra picks
// something new); after that it simply shows. Respects "Reduce motion". Kalam also has Hindi (Devanagari) letters.

import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View, type TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface TextLayoutLine { text: string; x: number; y: number; width: number; height: number }
const written = new Set<string>();
export const HAND_FONT = 'Kalam_300Light';

/** A small cream feather; its tip sits at the bottom-left corner of the 34 × 34 box. */
function Quill() {
  return (
    <Svg width={34} height={34} viewBox="0 0 34 34">
      <Path d="M2 32 C6 22 14 10 30 2 C26 14 18 24 2 32 Z" fill="#EDE6D8" stroke="#B9AE98" strokeWidth={0.8} />
      <Path d="M2 32 L27 5" stroke="#9C9077" strokeWidth={0.8} />
    </Svg>
  );
}

export function HandLine({ text, style, onDone }: { text: string; style: TextStyle; onDone?: () => void }) {
  const [lines, setLines] = useState<TextLayoutLine[] | null>(null);
  const [done, setDone] = useState(() => written.has(text));
  const [at, setAt] = useState(0); // the line being written
  const p = useRef(new Animated.Value(0)).current;

  // Reset when Myra picks a new line.
  useEffect(() => { setLines(null); setAt(0); p.setValue(0); setDone(written.has(text)); }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (done) onDone?.(); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (done) return;
    let off = false;
    AccessibilityInfo.isReduceMotionEnabled().then(r => { if (r && !off) { written.add(text); setDone(true); } }).catch(() => {});
    // Where the layout of lines is not reported (the website), just show the words.
    const t = setTimeout(() => { if (!off) setLines(l => { if (!l) { written.add(text); setDone(true); } return l; }); }, 600);
    return () => { off = true; clearTimeout(t); };
  }, [text, done]);

  // Write line by line: about 10 letters a second, a quill's unhurried pace.
  useEffect(() => {
    if (done || !lines?.length) return;
    if (at >= lines.length) { written.add(text); setDone(true); return; }
    p.setValue(0);
    const ms = Math.max(500, lines[at].text.trim().length * 95);
    const a = Animated.timing(p, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: false });
    a.start(({ finished }) => { if (finished) setAt(i => i + 1); });
    return () => a.stop();
  }, [lines, at, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const hand: TextStyle = { fontFamily: HAND_FONT, ...style };
  if (done) return <Text style={hand}>{text}</Text>;
  return (
    <View>
      {/* Laid out invisibly first, to learn where each line falls. */}
      <Text style={[hand, { opacity: 0 }]} onTextLayout={e => { if (!lines) setLines(e.nativeEvent.lines); }}>{text}</Text>
      {lines?.map((l, i) => i > at ? null : (
        <Animated.View key={i} style={{ position: 'absolute', left: l.x, top: l.y, height: l.height, overflow: 'hidden',
          width: i < at ? l.width + 4 : p.interpolate({ inputRange: [0, 1], outputRange: [0, l.width + 4] }) }}>
          <Text style={[hand, { width: l.width + 8 }]} numberOfLines={1}>{l.text.replace(/\n$/, '')}</Text>
        </Animated.View>
      ))}
      {lines && at < lines.length ? (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: lines[at].y + lines[at].height * 0.75 - 34,
          left: p.interpolate({ inputRange: [0, 1], outputRange: [lines[at].x - 2, lines[at].x + lines[at].width - 2] }) }}>
          <Quill />
        </Animated.View>
      ) : null}
    </View>
  );
}
