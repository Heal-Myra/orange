# 0048 — Parts in percent; Clear your mind by section

Date: 4 Nov 2026 · Founder: "Scoring has to be always in % across all cards except for the header items" and "Finding two work in each section gets you 20 % score and completing them gets you 80 % score."

## Decision
- Every ring key and box heading inside a card shows its part as a percentage of its aim or points (`pct` in `src/components/Rings.tsx`; `pts` now returns a percentage). The card's own score (the pill at the top and the ring's middle) stays in points so it adds up to the pillar.
- Clear your mind (40) from 4 Nov 2026 = Family + Work + Better me, 40/3 each: 20 % for writing down up to two to-dos for today in that part, 80 % for finishing up to two. Counts are kept on the day (`mind.sections`, [written, done]) from the to-do list. Days before keep "20 per focus to-do, two max".
