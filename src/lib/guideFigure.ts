// Myra's guide character for the breathing explainers: a calm, minimalist line figure, drawn from the practice data
// (src/lib/practiceGuide.ts). Pure geometry: it returns simple shapes, drawn by src/components/GuideFigure.tsx with
// react-native-svg. Kept free of React so the same drawing can be checked in tests and previews.

import type { Breath, LeftHand, Mouth, RightHand, Through } from './practiceGuide';

export type Pt = [number, number];
export type Shape =
  | { t: 'path'; d: string; stroke?: string; fill?: string; w?: number; o?: number; dash?: string }
  | { t: 'circle'; cx: number; cy: number; r: number; stroke?: string; fill?: string; w?: number; o?: number }
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number; stroke?: string; fill?: string; w?: number; o?: number; dash?: string };

// Calm sky tones (founder, 25 Oct 2026: the dark background was too dark).
export const FIG = { w: 320, h: 330, ink: '#2F5D66', fill: '#FFFFFF', glow: '#E0794F', air: '#3E9CC4', shade: '#D3E6F1' };

// Body landmarks (person's right is the viewer's left).
const HEAD: Pt = [160, 84];
const SHOULDER_R: Pt = [116, 156], SHOULDER_L: Pt = [204, 156];
export const NOSTRIL_R: Pt = [155, 101], NOSTRIL_L: Pt = [165, 101], MOUTH: Pt = [160, 111];

/** Where the hand is, and where its working finger touches (if anywhere). */
export interface HandAt { hand: Pt; tip?: Pt }
export const RIGHT: Record<RightHand, HandAt> = {
  knee: { hand: [86, 268] },
  mudra: { hand: [128, 124] },
  thumb: { hand: [139, 111], tip: NOSTRIL_R },
  ring: { hand: [140, 106], tip: NOSTRIL_L },
  ear: { hand: [121, 88], tip: [125, 84] },
  belly: { hand: [152, 226], tip: [156, 222] },
};
export const LEFT: Record<LeftHand, HandAt> = {
  knee: { hand: [234, 268] },
  ear: { hand: [199, 88], tip: [195, 84] },
};

const L1 = 60, L2 = 60;
const f = (n: number) => Math.round(n * 10) / 10;

/** Two-segment arm: the elbow that keeps the arm away from the body. */
export function elbow(s: Pt, t: Pt, outward: -1 | 1): Pt {
  const dx = t[0] - s[0], dy = t[1] - s[1];
  const d = Math.min(L1 + L2 - 0.5, Math.max(Math.abs(L1 - L2) + 8, Math.hypot(dx, dy)));
  const a = Math.atan2(dy, dx);
  const off = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const e1: Pt = [s[0] + L1 * Math.cos(a + off), s[1] + L1 * Math.sin(a + off)];
  const e2: Pt = [s[0] + L1 * Math.cos(a - off), s[1] + L1 * Math.sin(a - off)];
  return (e1[0] - e2[0]) * outward > 0 ? e1 : e2;
}

const mix = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
const frac = (x: number) => x - Math.floor(x);

export interface FigureState {
  right: HandAt; left: HandAt;   // already blended between poses
  settled: boolean;              // hands have arrived: show the touch points
  mouth: Mouth;
  breath: Breath; through?: Through;
  p: number;                     // 0..1 through the step
  time: number;                  // seconds, for gentle loops
  level: number;                 // chest fullness 0..1
}

/** Blend two hand positions (for smooth moves between steps). */
export const blendHand = (a: HandAt, b: HandAt, k: number): HandAt => ({ hand: mix(a.hand, b.hand, ease(k)), tip: b.tip ?? a.tip });

/** Chest fullness for a breath at a point in the step, starting from the level before it. */
export function chestLevel(breath: Breath, p: number, from: number, time: number): number {
  switch (breath) {
    case 'in': return from + (1 - from) * ease(p);
    case 'out': case 'hum': case 'chant': return from * (1 - ease(p));
    case 'hold': return from;
    case 'pump': return 0.35 - 0.25 * Math.exp(-frac(time) * 6);
    default: return 0.35 + 0.08 * Math.sin(time * 1.3);
  }
}

function arm(s: Pt, h: HandAt, outward: -1 | 1, settled: boolean): Shape[] {
  const e = elbow(s, h.hand, outward);
  const d = `M${f(s[0])} ${f(s[1])} Q${f(e[0])} ${f(e[1])} ${f(h.hand[0])} ${f(h.hand[1])}`;
  const out: Shape[] = [
    { t: 'path', d, stroke: FIG.ink, w: 14 },
    { t: 'path', d, stroke: FIG.fill, w: 9.5 },
  ];
  if (h.tip) {
    const [hx, hy] = h.hand, [tx, ty] = h.tip;
    // The working finger: a short curve from the hand to the touch point (over the nose for the ring finger).
    const cx = (hx + tx) / 2, cy = Math.min(hy, ty) - (Math.abs(tx - hx) > 14 ? 10 : 2);
    out.push({ t: 'path', d: `M${f(hx)} ${f(hy)} Q${f(cx)} ${f(cy)} ${f(tx)} ${f(ty)}`, stroke: FIG.ink, w: 4.5 });
  }
  out.push({ t: 'circle', cx: f(h.hand[0]), cy: f(h.hand[1]), r: 8.5, fill: FIG.fill, stroke: FIG.ink, w: 2.2 });
  if (h.tip && settled) out.push({ t: 'circle', cx: f(h.tip[0]), cy: f(h.tip[1]), r: 4.6, fill: FIG.glow });
  return out;
}

function airFrom(through: Through | undefined): { at: Pt; dir: Pt }[] {
  const down: Pt = [0, 1];
  if (through === 'left') return [{ at: NOSTRIL_L, dir: [0.75, 0.66] }];
  if (through === 'right') return [{ at: NOSTRIL_R, dir: [-0.75, 0.66] }];
  if (through === 'mouth') return [{ at: MOUTH, dir: down }];
  return [{ at: NOSTRIL_R, dir: [-0.6, 0.8] }, { at: NOSTRIL_L, dir: [0.6, 0.8] }];
}

/** The whole picture for one moment. */
export function figure(s: FigureState): Shape[] {
  const out: Shape[] = [];
  const w = 1 + 0.07 * s.level;                 // chest widens on the in-breath
  const belly = s.breath === 'pump' ? -6 * Math.exp(-frac(s.time) * 6) : 0; // belly snaps in on each pump
  // Floor shadow, seated legs.
  out.push({ t: 'ellipse', cx: 160, cy: 304, rx: 122, ry: 9, fill: FIG.shade, o: 0.9 });
  out.push({ t: 'path', d: 'M56 284 C96 254 224 254 264 284 C246 306 74 306 56 284 Z', fill: FIG.fill, stroke: FIG.ink, w: 2.2 });
  out.push({ t: 'path', d: 'M112 287 C142 276 178 276 208 287', stroke: FIG.ink, w: 1.6, o: 0.55 });
  // Torso (breathes), neck, head.
  const x = (dx: number) => f(160 + dx);
  out.push({ t: 'path', fill: FIG.fill, stroke: FIG.ink, w: 2.2, d:
    `M${x(-46 * w)} 152 C${x(-58 * w)} 196 ${x(-52 * w + belly * -1)} 238 ${x(-44)} 270 L${x(44)} 270 ` +
    `C${x(52 * w + belly)} 238 ${x(58 * w)} 196 ${x(46 * w)} 152 C${x(22)} 142 ${x(-22)} 142 ${x(-46 * w)} 152 Z` });
  out.push({ t: 'path', d: 'M152 116 L152 146 Q160 150 168 146 L168 116', fill: FIG.fill, stroke: FIG.ink, w: 2.2 });
  out.push({ t: 'circle', cx: HEAD[0], cy: HEAD[1], r: 35, fill: FIG.fill, stroke: FIG.ink, w: 2.2 });
  // Face: closed eyes, nose, mouth.
  out.push({ t: 'path', d: 'M141 82 q6.5 5 13 0 M166 82 q6.5 5 13 0', stroke: FIG.ink, w: 2 });
  out.push({ t: 'path', d: 'M160 84 L156.5 99 Q160 102 163.5 99', stroke: FIG.ink, w: 1.8 });
  if (s.mouth === 'tongue') {
    out.push({ t: 'ellipse', cx: 160, cy: 111, rx: 6, ry: 4.5, stroke: FIG.ink, w: 1.8, fill: FIG.shade });
    out.push({ t: 'path', d: 'M156 111 Q160 120 164 111', stroke: FIG.glow, w: 3 });
  } else if (s.mouth === 'om') {
    out.push({ t: 'ellipse', cx: 160, cy: 111, rx: 4.5, ry: 5.5, stroke: FIG.ink, w: 1.8, fill: FIG.shade });
  } else {
    out.push({ t: 'path', d: 'M153 110 q7 4 14 0', stroke: FIG.ink, w: 1.8 });
  }
  // Sound: soft ripples around the head while humming or chanting.
  if (s.breath === 'hum' || s.breath === 'chant') {
    for (let k = 0; k < 3; k++) {
      const u = frac(s.time * 0.55 + k / 3), r = 44 + 30 * u, o = 0.7 * (1 - u);
      out.push({ t: 'path', d: `M${f(160 - r * 0.62)} ${f(84 - r * 0.78)} A${f(r)} ${f(r)} 0 0 0 ${f(160 - r * 0.62)} ${f(84 + r * 0.78)}`, stroke: FIG.air, w: 2.2, o });
      out.push({ t: 'path', d: `M${f(160 + r * 0.62)} ${f(84 - r * 0.78)} A${f(r)} ${f(r)} 0 0 1 ${f(160 + r * 0.62)} ${f(84 + r * 0.78)}`, stroke: FIG.air, w: 2.2, o });
    }
  }
  // Arms on top of the body.
  out.push(...arm(SHOULDER_R, s.right, -1, s.settled));
  out.push(...arm(SHOULDER_L, s.left, 1, s.settled));
  // Air: small light dots flowing into or out of the nose (or mouth).
  const flowing = s.breath === 'in' || s.breath === 'out' || s.breath === 'pump' || s.breath === 'hum' || s.breath === 'chant';
  if (flowing) {
    const into = s.breath === 'in';
    const speed = s.breath === 'pump' ? 2.2 : 0.75;
    for (const { at, dir } of airFrom(s.breath === 'chant' ? 'mouth' : s.through)) {
      for (let k = 0; k < 4; k++) {
        let u = frac(s.time * speed + k / 4);
        if (s.breath === 'pump') u = Math.min(1, frac(s.time) * 2.5 + k * 0.08);
        const dist = into ? 52 - 46 * u : 6 + 46 * u;
        const o = Math.sin(Math.PI * u) * (s.breath === 'pump' ? 1 - frac(s.time) : 1);
        out.push({ t: 'circle', cx: f(at[0] + dir[0] * dist), cy: f(at[1] + dir[1] * dist), r: 2.6 + 0.8 * (1 - u), fill: FIG.air, o: f(o) });
      }
    }
  }
  // Holding: a quiet ring around the chest.
  if (s.breath === 'hold') out.push({ t: 'ellipse', cx: 160, cy: 200, rx: f(66 * w), ry: 70, stroke: FIG.air, w: 1.6, o: 0.35, dash: '3 7' });
  return out;
}

/** The same picture as an SVG string (previews and tests). */
export function figureSvg(s: FigureState, bg = '#C4E4F8'): string {
  const a = (sh: Shape) => `${sh.stroke ? ` stroke="${sh.stroke}"` : ''} fill="${sh.fill ?? 'none'}"${sh.w ? ` stroke-width="${sh.w}"` : ''}${sh.o != null ? ` opacity="${sh.o}"` : ''} stroke-linecap="round" stroke-linejoin="round"`;
  const body = figure(s).map(sh => sh.t === 'path' ? `<path d="${sh.d}"${a(sh)}${sh.dash ? ` stroke-dasharray="${sh.dash}"` : ''}/>`
    : sh.t === 'circle' ? `<circle cx="${sh.cx}" cy="${sh.cy}" r="${sh.r}"${a(sh)}/>`
    : `<ellipse cx="${sh.cx}" cy="${sh.cy}" rx="${sh.rx}" ry="${sh.ry}"${a(sh)}${sh.dash ? ` stroke-dasharray="${sh.dash}"` : ''}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FIG.w} ${FIG.h}" style="background:${bg}">${body}</svg>`;
}
