# 0040 — One recommendation beside the score, with its points

Date: 31 Oct 2026 · Founder's request ("Myra recommends to the right of the total score … always one item basis the time of day and biggest concern item resolution and impact it can create on score").

## Decision
- Today's My day card: rings on the left, Myra's single recommendation on the right (replaces Going well / Work on from 0038's update). Under the card, the three Body · Mind · Soul circles; then only the Ask Myra box.
- The item is chosen in `src/lib/nextStep.ts`, not by the AI, so the "+N" is exact and works offline:
  - every step that fits the hour (sleep log before noon; breathing 10 min; a 20-minute walk 6 am–8 pm; next meal, food points shared over meals left; a focus to-do 8 am–9 pm; gratitude and a kind act from 4 pm; Daily Wisdom; Tao);
  - its gain comes from the same formulas as `scoring.ts` (e.g. 10 of a 20-minute breathing target = +15 Mind; a walk adds 2,000 steps and 20 active minutes);
  - steps that suit the hour count 1.5× (morning: sleep, breathing, Wisdom, Tao; midday: food, walk, to-dos; evening: journal, walk, food); the biggest wins.
  - after 9:30 pm only Yoga Nidra and the journal (founder, 22 Oct 2026); a habit due now comes first, with a tick.
- Phone activity is never suggested: its points are yesterday's.
- The AI daily guidance still runs (GuidanceCard headless) for Myra's line at the bottom of each card on the tabs.

## Update, 31 Oct 2026 (22:40)
Shown impact first (option 5 of 10, with option 10's few words): big "+N", "Body/Mind/Soul points", what to do in 2–3 words, and a Start now button.

## Update, 31 Oct 2026 (22:50)
Founder: impact first, then one small instructing line (a nudge, like option 3, no minutes) and a round start button; a thin divider between the rings and Myra (option 2).

## Update, 31 Oct 2026 (23:05)
The nudge is written by a quill in Kalam Light (founder picked option 1 of 10 pens, then 1 of 10 simple fonts): `src/components/HandLine.tsx`. Once per session per line; respects Reduce motion.
