// Happy Orange theme (19 Oct 2026): a soft orange-fruit (tangerine) background
// with frosted-glass cards (translucent white, blurred on the web) in the style of Apple's glass design.
// Pillar colours: green Body, blue Mind, burnt saffron Soul.
// Text contrast was checked against the orange and the glass cards.

export const colors = {
  bg: '#FFBE85',
  surface: 'rgba(255,255,255,0.40)', // glass card
  field: 'rgba(255,255,255,0.60)', // text boxes
  sunk: 'rgba(255,255,255,0.45)', // meter tracks
  ink: '#1A1C2B',
  muted: '#4A3A30',
  line: 'rgba(255,255,255,0.65)',
  body: '#1F6B40',
  mind: '#2A55B8',
  soul: '#9A3B12',
  accent: '#A33A1F',
  onAccent: '#FFFFFF',
  good: '#1F6B40',
  warn: '#7C4A03',
  bad: '#A11D1D',
};

/** Frosted-glass blur, applied on the web (native apps ignore it). */
export const glass = { backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)' } as object;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 16 };
