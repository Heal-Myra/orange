# 0062 — Ganga Dusk: the glass look

Date: 19 Nov 2026 · Founder chose design 2 of 10 ("Ganga Dusk") on 18 Nov; "all text … is in white and only the result
fair good bad excellent seems to be in a different color" (Oura as the reference); "Go" on 19 Nov.

Replaces the Calm Teal palette of decision 0007 (kept in src/theme.ts as CALM_TEAL; `LOOK` switches back).

- **Scene:** an evening river sky over soft hills behind every screen (GlassBackdrop, drawn in SVG).
- **Cards:** smoked see-through glass (rgba(24,22,32,0.66)) with a thin light edge.
- **Text:** all white; quieter notes in a dimmer white. Myra's lines, links, the name and the tabs are white too.
- **Buttons:** see-through glass pills with white words; selected chips are white with dark words.
- **The one coloured word:** the result band on My day: Flourishing soft green, Balanced soft teal, Finding your footing
  soft amber, Needs care soft coral (red was tried and dropped the same day). Score rings keep their pillar colours.
- **Frosted blur:** the real blur behind the glass needs expo-blur, so it comes with the next App Store build. This
  update gives the look without the blur.
- Full-screen practices (Breathe, Focus, Calm, Letting go, Sound bath playing) keep their own calm colours.
