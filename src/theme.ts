// Happy Orange theme (19 Oct 2026): a vivid orange like the iPhone's orange finish,
// with frosted-glass cards (translucent white, blurred on the web) in the style of Apple's glass design.
// Pillar colours are dark so they stay readable on orange: green Body, navy Mind, maroon Soul.
// Text contrast was checked against the orange and the glass cards.

export const colors = {
  bg: '#EE6F2D',
  surface: 'rgba(255,255,255,0.30)', // glass card
  field: 'rgba(255,255,255,0.50)', // text boxes
  sunk: 'rgba(255,255,255,0.35)', // meter tracks
  ink: '#1A1C2B',
  muted: '#3B2A20',
  line: 'rgba(255,255,255,0.55)',
  body: '#14532D',
  mind: '#1E3A8A',
  soul: '#7A1F4B',
  accent: '#2B1408',
  onAccent: '#FFFFFF',
  good: '#14532D',
  warn: '#7C4A03',
  bad: '#8B1A1A',
};

/** Frosted-glass blur, applied on the web (native apps ignore it). */
export const glass = { backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)' } as object;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 16 };
