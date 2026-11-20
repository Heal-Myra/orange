// Happy Orange theme "Calm Teal" (chosen by the founder, 19 Oct 2026, from his three reference apps):
// a clean white-grey page, white cards with a soft shadow, one calm teal for buttons and ticks,
// and one warm coral, Happy Orange's signature: everything Happy Orange itself produces (the name, scores,
// guidance, AI reads, explanations, Myra) is coral, so people can tell it is Happy Orange's own output.
// Pillar colours exactly as in look A: green Body, teal Mind, soft orange Soul (founder, 19 Oct 2026, 09:43).
// Body text, notes and buttons read at 4.5:1 or more; pillar colours carry large bold labels (3:1 or more).

const CALM_TEAL = {
  bg: '#F5F8F9',
  surface: '#FFFFFF', // cards
  sheet: '#FFFFFF', // sheets and pop-ups (always solid)
  field: '#F7FAFB', // text boxes
  sunk: '#E8EFF1', // meter tracks
  ink: '#1F2A30',
  muted: '#5F6B70',
  line: '#E2E9EB',
  body: '#6A9A3B',
  mind: '#3C9AA2',
  soul: '#E0794F',
  tint: '#E6F3F4', // the soft disc behind the Today circle
  accent: '#2A7C83', // main buttons, ticks, links
  onAccent: '#FFFFFF',
  insight: '#C0513A', // Happy Orange's signature: anything the app itself produces (guidance, scores, AI reads, Myra)
  onInsight: '#FFFFFF',
  brand: '#C0513A', // the Happy Orange name (same signature coral)
  good: '#4C7A27', // darker green, for small text
  warn: '#8A5A00',
  bad: '#B3261E',
};

// "Ganga Dusk" glass look (founder chose design 2 of 10, 18 Nov 2026; decision 0062): an evening river sky behind every
// screen, smoked see-through cards with a fine light edge, warm white text, amber buttons, and the signature coral
// lifted so it reads on dark. Text stays at 4.5:1 or more on the darkest card.
const GANGA_DUSK: typeof CALM_TEAL = {
  bg: '#141519',
  surface: 'rgba(255,255,255,0.045)',
  sheet: '#1E2029',
  field: 'rgba(255,255,255,0.08)',
  sunk: 'rgba(255,255,255,0.14)',
  // Founder, 19 Nov 2026 (Oura as the reference): all text white; only a result word (Flourishing, Balanced, Needs
  // care…) carries a colour, from statusColor() below.
  ink: '#FFFFFF',
  muted: 'rgba(255,255,255,0.74)',
  line: 'rgba(255,255,255,0.08)',
  body: '#A8D07A',
  mind: '#7FCFD6',
  soul: '#F3A37A',
  tint: 'rgba(255,255,255,0.10)',
  accent: '#FFFFFF',
  onAccent: '#1B1A22',
  insight: '#FFFFFF',
  onInsight: '#1B1A22',
  brand: '#FFFFFF',
  good: '#FFFFFF',
  warn: '#FFFFFF',
  bad: '#FFFFFF',
};

// Pastel glass (founder, 20 Nov 2026: "not impressed" with the dark; decision 0065): each part of the app has its own
// soft pastel sky that changes with its score (src/lib/livingColour.ts); frosted white glass cards; deep ink text.
const PASTEL_GLASS: typeof CALM_TEAL = {
  ...GANGA_DUSK,
  bg: '#F6EFEA',
  surface: 'rgba(255,255,255,0.46)',
  sheet: '#FBF8F5',
  field: 'rgba(255,255,255,0.6)',
  sunk: 'rgba(46,40,56,0.08)',
  ink: '#2E2838',
  muted: 'rgba(46,40,56,0.64)',
  line: 'rgba(46,40,56,0.09)',
  body: '#5E9A4A',
  mind: '#6B5FC4',
  soul: '#B54C7E',
  tint: 'rgba(255,255,255,0.55)',
  accent: '#2E2838',
  onAccent: '#FFFFFF',
  insight: '#2E2838',
  onInsight: '#FFFFFF',
  brand: '#2E2838',
  good: '#2E2838',
  warn: '#2E2838',
  bad: '#2E2838',
};
export const LOOK = 'pastel' as 'calm' | 'ganga' | 'pastel';
export const colors = LOOK === 'pastel' ? PASTEL_GLASS : LOOK === 'ganga' ? GANGA_DUSK : CALM_TEAL;
export const isGlass = LOOK !== 'calm';
/** Light glass (pastel skies, dark text) versus dark glass (Ganga Dusk, white text). */
export const isLight = LOOK === 'pastel';
/** Glass pieces that sit on the sky: circles, pills, tracks, the tab bar. */
export const glass = isLight
  ? { fill: 'rgba(255,255,255,0.45)', fillSoft: 'rgba(255,255,255,0.32)', line: 'rgba(255,255,255,0.7)', track: 'rgba(46,40,56,0.10)', trackFill: '#2E2838', nav: 'rgba(255,255,255,0.72)', shade: '0 8px 24px rgba(80,60,90,0.12)' }
  : { fill: 'rgba(255,255,255,0.06)', fillSoft: 'rgba(18,16,22,0.38)', line: 'rgba(255,255,255,0.16)', track: 'rgba(255,255,255,0.12)', trackFill: '#F3EEE8', nav: '#1E2029', shade: '0 8px 24px rgba(0,0,0,0.35)' };

/** Soft card shadow. */
export const shadow = isGlass ? 'none' : '0 2px 12px rgba(31, 42, 48, 0.07)';

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 16 };

/** The one coloured word: a result band (Ganga Dusk; in Calm Teal results stay muted as before). */
export function statusColor(band: string): string {
  if (LOOK === 'calm') return CALM_TEAL.muted;
  if (LOOK === 'pastel') return band === 'Flourishing' ? '#3F7F35' : band === 'Balanced' ? '#2C7486' : band === 'Finding your footing' ? '#A06C14' : band === 'Needs care' ? '#BB5A44' : PASTEL_GLASS.muted;
  return band === 'Flourishing' ? '#A8D07A' : band === 'Balanced' ? '#7FCFD6' : band === 'Finding your footing' ? '#F2C46B' : band === 'Needs care' ? '#F4B183' : 'rgba(255,255,255,0.74)';
}

/** Each card's own soft colour wash (founder, 19 Nov 2026, Oura's heart-rate and readiness cards as the reference):
 *  every card a slightly different tint that fades into the same dark, text always white. Keyed by the card's anchor. */
export const CARD_TINT: Record<string, string> = {
  day: '#B5834C', pillars: '#6B6FA5', records: '#A88A3E',
  food: '#7FA36B', sleep: '#5B6FB5', movement: '#5FA37A', body: '#4C9AA0',
  tasks: '#4C8FA6', focus: '#4C8FA6', meditation: '#7C6BB5', phone: '#5E6B80',
  gratitude: '#B5707F', love: '#B5707F', wisdom: '#B58A4C', tao: '#6E9A5C', letgo: '#8A7FB5',
};
export const DEFAULT_TINT = '#5E6B85';

/** Oura-like type (redesign, 19 Nov 2026; decision 0063): three voices used the same way everywhere.
 *  Thin large numbers, a serif for the human sentence (Myra's and the masters' words), small spaced capitals for labels. */
export const font = {
  serif: (lang: 'en' | 'hi') => (lang === 'hi' ? 'TiroDevanagariHindi_400Regular' : 'InstrumentSerif_400Regular'),
  thin: '200' as const,
  light: '300' as const,
};
