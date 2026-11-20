// Living colour (founder, 20 Nov 2026; decision 0065): each part of the app has its own soft pastel, and the colour
// changes with that part's score in the way the part should feel. Today: the sun rises with My day. Body: stronger
// as you move and eat well. Mind: lighter as the mind settles. Soul: a light you discover, spreading from a diya.
// Spaces: the sky clears as rooms get tidier. A low score never looks alarming; it simply looks quieter.

export type Section = 'today' | 'body' | 'mind' | 'soul' | 'spaces';

/** A glow drawn on top of the sky: centre and radius as shares of the screen width/height, colour, opacity. */
export interface Glow { cx: number; cy: number; r: number; color: string; opacity: number; rx?: number; ry?: number }
export interface Sky { stops: [string, string, string]; glows: Glow[]; ink: string; word: string; tab: string }

const hex = (x: string) => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
export function mix(a: string, b: string, t: number): string {
  const A = hex(a), B = hex(b), k = Math.max(0, Math.min(1, t));
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
}

/** Each section's deep text tone and its colour for the tab bar (founder, 20 Nov 2026: five section colours). */
export const SECTION = {
  today: { name: 'Peach Dawn', ink: '#4A2C2A', word: '#C35E3F', tab: '#E88A64' },
  body: { name: 'Sage Leaf', ink: '#25391F', word: '#4A7F36', tab: '#6FA65A' },
  mind: { name: 'Lavender Mist', ink: '#2E2A52', word: '#5E52B8', tab: '#8B7FE0' },
  soul: { name: 'Lotus Pink', ink: '#47263A', word: '#A8456F', tab: '#C774A0' },
  spaces: { name: 'Sky Aqua', ink: '#1D3646', word: '#2B7299', tab: '#5A9EC4' },
} as const;

/** The sky for a section at a score (0–100; null = nothing logged yet, drawn as the quiet start). */
export function skyFor(section: Section, score: number | null): Sky {
  const t = score == null ? 0.15 : Math.max(0, Math.min(1, score / 100));
  const s = SECTION[section];
  const base = { ink: s.ink, word: s.word, tab: s.tab };
  switch (section) {
    case 'today': return { ...base,
      stops: [mix('#C9CCDA', '#F9B98F', t), mix('#E2DCE0', '#FBD6BE', t), mix('#EFEAE8', '#FDEDE2', t)],
      glows: [
        { cx: 0.5, cy: 0.62 - 0.42 * t, r: 0.55 + 0.4 * t, color: '#FFECD2', opacity: 0.5 + 0.45 * t }, // the sun's light
        { cx: 0.5, cy: 0.62 - 0.42 * t, r: 0.06, color: '#FFF8EC', opacity: 0.55 + 0.4 * t },           // the sun
      ] };
    case 'body': return { ...base,
      stops: [mix('#E9EDE5', '#8FC27A', t), mix('#F0F2EC', '#BFDFAD', t), mix('#F6F6F2', '#E6F2DD', t)],
      glows: [{ cx: 0.2, cy: 0.12, r: 0.9, color: '#FFFFE6', opacity: 0.15 + 0.25 * t }] };
    case 'mind': {
      const swirls: Glow[] = [0, 1, 2, 3, 4, 5].slice(0, Math.round(6 * (1 - t))).map(i => ({
        cx: ((i * 37) % 100) / 100, cy: ((i * 61) % 100) / 100 * 0.7, r: 0.3 + (i % 3) * 0.1, color: i % 2 ? '#7864C8' : '#AA96E6', opacity: 0.35 * (1 - t),
      }));
      return { ...base,
        stops: [mix('#B3A9E4', '#ECE8FB', t), mix('#C7BEEF', '#F2EFFC', t), mix('#D6CFF3', '#F8F6FD', t)],
        glows: [...swirls, { cx: 0.5, cy: 0.3, r: 0.35 + 0.5 * t, color: '#FFFFFF', opacity: 0.25 + 0.5 * t }] };
    }
    case 'soul': {
      const sparks: Glow[] = Array.from({ length: Math.round(12 * t) }, (_, i) => ({
        cx: ((i * 53) % 100) / 100, cy: 0.03 + (((i * 29) % 14) / 100), r: 0.006, color: '#FFF0DC', opacity: 0.55,
      }));
      return { ...base,
        stops: [mix('#DCD0D7', '#F4C7DA', t), mix('#E4DADF', '#F8D9E6', t), mix('#ECE4E8', '#FBE8EF', t)],
        glows: [
          { cx: 0.5, cy: 0.98, r: 0.25 + 1.0 * t, color: '#FFC8D6', opacity: 0.55 + 0.3 * t }, // the light spreading
          { cx: 0.5, cy: 0.98, r: 0.12 + 0.35 * t, color: '#FFD696', opacity: 0.8 },            // the diya's flame
          ...sparks,
        ] };
    }
    case 'spaces': return { ...base,
      stops: [mix('#C9D0D6', '#A6D6EF', t), mix('#D8DDE1', '#D0EAF6', t), mix('#E3E6E8', '#F1F9FD', t)],
      glows: [0, 1, 2, 3].map(i => ({ cx: 0.2 + 0.25 * i, cy: 0.18 + 0.08 * (i % 2), r: 0.3, rx: 0.4, ry: 0.06, color: '#E1E4E8', opacity: 0.6 * (1 - t) })) };
  }
}

/** Which section a route belongs to. */
export function sectionOf(path: string): Section {
  if (path.startsWith('/body')) return 'body';
  if (path.startsWith('/mind')) return 'mind';
  if (path.startsWith('/soul')) return 'soul';
  if (path.startsWith('/spaces')) return 'spaces';
  return 'today';
}
