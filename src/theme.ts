// Happy Orange theme "Marigold & leaf" (chosen by the founder, 19 Oct 2026):
// marigold yellow background for happiness, leaf green for health (buttons, progress, ticks),
// a deep orange for the Happy Orange name, and frosted-glass cards in the style of Apple's glass design.
// Pillar colours: leaf green Body, blue Mind, burnt saffron Soul.
// Text contrast was checked against the orange and the glass cards.

export const colors = {
  bg: '#FFE0A3',
  surface: 'rgba(255,255,255,0.40)', // glass card
  field: 'rgba(255,255,255,0.60)', // text boxes
  sunk: 'rgba(255,255,255,0.45)', // meter tracks
  ink: '#1A1C2B',
  muted: '#4A3A30',
  line: 'rgba(255,255,255,0.65)',
  body: '#276B2B',
  mind: '#2A55B8',
  soul: '#9A3B12',
  accent: '#276B2B',
  onAccent: '#FFFFFF',
  brand: '#B4450A', // the orange of the Happy Orange name
  good: '#276B2B',
  warn: '#7C4A03',
  bad: '#A11D1D',
};

/** Frosted-glass blur, applied on the web (native apps ignore it). */
export const glass = { backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)' } as object;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 16 };
