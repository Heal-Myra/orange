# 0065 · Pastel glass with living colour

Date: 20 Nov 2026 · Founder: "I am not impressed with this color gradient … more soothing vibes e.g. pastel colors";
"5 distinctive color for Today, Body, Mind, Soul and Spaces"; "although color theme is fixed but intensity or gradient varies
as the score progresses"; "Go for screens with different color for body mind and soul cards".

## Decision
- Replaces the dark Ganga Dusk (0062); Ganga stays in code as a LOOK option.
- Five section colours, equally soft, spread round the colour wheel: Today Peach Dawn, Body Sage Leaf, Mind Lavender Mist,
  Soul Lotus Pink, Spaces Sky Aqua (`src/lib/livingColour.ts`, SECTION).
- The sky behind each screen changes with that section's score, easing over about two seconds (GlassBackdrop):
  Today: the sun rises with My day. Body: stronger, richer green as the score rises. Mind: lighter and calmer, restless
  swirls fade. Soul: a diya's light spreads, rose and gold open, small sparks appear. Spaces: the haze clears to bright blue.
  A low score never looks alarming; it looks quieter.
- Cards are frosted white glass tinted with their screen's colour; text is deep ink; the tab you are on takes its colour;
  result words keep band colours; calories, carbs or fat above the aim show red (founder, 20 Nov 2026).
- Tab headers are a frosted band so cards scrolling underneath never collide with the title.

## Also in this release
Food parts as a percentage of the aim (not counts); Face & beauty as lines like Food and Movement.

## Not yet
Pages opened from a card keep a plain light top bar; the real frosted blur needs the next App Store build (expo-blur).
