// Happy Orange theme "Calm Teal" (chosen by the founder, 19 Oct 2026, from his three reference apps):
// a clean white-grey page, white cards with a soft shadow, one calm teal for buttons and ticks,
// and one warm coral, Happy Orange's signature: everything Happy Orange itself produces (the name, scores,
// guidance, AI reads, explanations, Myra) is coral, so people can tell it is Happy Orange's own output.
// Pillar colours: leaf green Body, teal Mind, amber Soul. Every text colour reads at 4.5:1 or more on white.

export const colors = {
  bg: '#F5F8F9',
  surface: '#FFFFFF', // cards
  field: '#F7FAFB', // text boxes
  sunk: '#E8EFF1', // meter tracks
  ink: '#1F2A30',
  muted: '#5F6B70',
  line: '#E2E9EB',
  body: '#4C7A27',
  mind: '#2A7C83',
  soul: '#A85F1A',
  accent: '#2A7C83', // main buttons, ticks, links
  onAccent: '#FFFFFF',
  insight: '#C0513A', // Happy Orange's signature: anything the app itself produces (guidance, scores, AI reads, Myra)
  onInsight: '#FFFFFF',
  brand: '#C0513A', // the Happy Orange name (same signature coral)
  good: '#4C7A27',
  warn: '#8A5A00',
  bad: '#B3261E',
};

/** Soft card shadow. */
export const shadow = '0 2px 12px rgba(31, 42, 48, 0.07)';

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 16 };
