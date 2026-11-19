// Happy Orange theme "Calm Teal" (chosen by the founder, 19 Oct 2026, from his three reference apps):
// a clean white-grey page, white cards with a soft shadow, one calm teal for buttons and ticks,
// and one warm coral, Happy Orange's signature: everything Happy Orange itself produces (the name, scores,
// guidance, AI reads, explanations, Myra) is coral, so people can tell it is Happy Orange's own output.
// Pillar colours exactly as in look A: green Body, teal Mind, soft orange Soul (founder, 19 Oct 2026, 09:43).
// Body text, notes and buttons read at 4.5:1 or more; pillar colours carry large bold labels (3:1 or more).

const CALM_TEAL = {
  bg: '#F5F8F9',
  surface: '#FFFFFF', // cards
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
  bg: '#1B1E2B',
  surface: 'rgba(24,22,32,0.66)',
  field: 'rgba(255,255,255,0.08)',
  sunk: 'rgba(255,255,255,0.14)',
  ink: '#F6F1EA',
  muted: '#C9C2B8',
  line: 'rgba(255,255,255,0.16)',
  body: '#A8D07A',
  mind: '#7FCFD6',
  soul: '#F3A37A',
  tint: 'rgba(255,255,255,0.08)',
  accent: '#F0A35E',
  onAccent: '#1B1A22',
  insight: '#F4B183',
  onInsight: '#1B1A22',
  brand: '#F4B183',
  good: '#A8D07A',
  warn: '#F2C46B',
  bad: '#F29A8A',
};

export const LOOK: 'calm' | 'ganga' = 'ganga';
export const colors = LOOK === 'ganga' ? GANGA_DUSK : CALM_TEAL;
export const isGlass = LOOK === 'ganga';

/** Soft card shadow. */
export const shadow = LOOK === 'ganga' ? 'inset 0 1px 0 rgba(255,255,255,0.18)' : '0 2px 12px rgba(31, 42, 48, 0.07)';

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 16 };
