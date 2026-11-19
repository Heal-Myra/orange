# 0063 · Oura-like redesign

Date: 19 Nov 2026 · Founder: "All ten" (proposal: claude.ai/artifact/4LZj9zq6ofDEBuqpxhM21k)

## Decision
Bring Happy Orange closer to Oura's calmer design, keeping Body, Mind, Soul, Myra and the Ganga Dusk colours (0062).
Ten changes: a living dusk scene at the top of Today; Body/Mind/Soul score circles as a row; one hero number, one serif word,
one line; three type voices (thin numbers, Instrument Serif / Tiro Devanagari Hindi for Myra's and the masters' words, spaced
capitals for labels); one card header (icon in a circle, name, coloured band word, chevron); detail pages with the chart first,
then score, insight, "What made this score" bars and key-number tiles; a floating pill tab bar with a round ✦ Myra button;
a self-filling "Your day" timeline; weekly rituals as seven day circles; glass header buttons.

Working rule (founder, 19 Nov 2026): every step is shown as a before/after screenshot side by side and built only on "go".

## Charts
Circles: how am I today. Bars: what made this score (replaces 0037's concentric rings + side boxes on detail pages).
Lines/steps: through the day. Seven bars with a dotted goal: the week. Seven day circles: habits. Arc: near my goal.

## Step 1 (shipped 19 Nov 2026)
Fonts loaded; `Serif`, `BigNum`, `CardHead`, `Tile` in ui.tsx; scored cards' `Heading` becomes the one card header in the
glass look (icon from the card's anchor, band word from its score); thin scores without the pill; floating tab bar
(src/components/FloatingTabBar.tsx) with Myra's ✦; glass Profile button; "HAPPY ORANGE" spaced title; top-level cards run edge
to edge (founder: "no space left on left and right side"); light status bar text. Includes the per-card colour wash preview.

## Step 2 (shipped 19 Nov 2026)
src/components/DuskScene.tsx (the scene, by hour), TodayHero.tsx (circles, arc hero, Myra's line), YourDay.tsx (timeline).
The hero is the My day score rather than steps: steps need Apple Health, My day always has a number. The rings cards stay
for the Calm Teal look only.
