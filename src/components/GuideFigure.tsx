// Draws Myra's guide character (src/lib/guideFigure.ts) and animates it through a practice step: hands glide to their
// new place, the chest rises and falls with the breath, and air or sound flows. Placeholder art until the designed
// character arrives (decision 0032); it reads the same practice data.
import { useEffect, useRef, useState } from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { blendHand, chestLevel, FIG, figure, LEFT, RIGHT, type HandAt } from '../lib/guideFigure';
import type { GuideStep } from '../lib/practiceGuide';

const MOVE = 0.7; // seconds for the hands to move

export function GuideFigure({ step, playing, size = 280 }: { step: GuideStep; playing: boolean; size?: number }) {
  const [now, setNow] = useState(0);            // seconds since this step began (paused time does not count)
  const from = useRef<{ right: HandAt; left: HandAt; level: number }>({ right: RIGHT[step.pose.right], left: LEFT[step.pose.left], level: 0.35 });
  const last = useRef({ right: RIGHT[step.pose.right], left: LEFT[step.pose.left], level: 0.35 });

  // A new step starts from wherever the figure was.
  useEffect(() => { from.current = { ...last.current }; setNow(0); }, [step]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0, prev = Date.now();
    const tick = () => { const t = Date.now(); setNow(n => n + (t - prev) / 1000); prev = t; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, step]);

  const k = Math.min(1, now / MOVE);
  const right = blendHand(from.current.right, RIGHT[step.pose.right], k);
  const left = blendHand(from.current.left, LEFT[step.pose.left], k);
  const p = Math.min(1, now / step.seconds);
  const level = chestLevel(step.breath, p, from.current.level, now);
  last.current = { right, left, level };
  const shapes = figure({ right, left, settled: k >= 1, mouth: step.pose.mouth, breath: step.breath, through: step.through, p, time: now, level });

  return (
    <Svg width={size} height={(size * FIG.h) / FIG.w} viewBox={`0 0 ${FIG.w} ${FIG.h}`}>
      {shapes.map((s, i) => {
        const common = { stroke: s.stroke, fill: s.fill ?? 'none', strokeWidth: s.w, opacity: s.o, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
        if (s.t === 'path') return <Path key={i} d={s.d} strokeDasharray={s.dash} {...common} />;
        if (s.t === 'circle') return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} {...common} />;
        return <Ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} strokeDasharray={s.dash} {...common} />;
      })}
    </Svg>
  );
}
