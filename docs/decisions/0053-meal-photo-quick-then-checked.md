# 0053 — Meal photos: quick reading first, careful IFCT check after, and "My dishes"

Date: 9 November 2026 · Status: decided (founder, "Go")

**Problem.** A tester waited a long time on "Reading your plate…" and sometimes saw "Could not reach the AI": the careful
reading (Claude Sonnet, then IFCT 2017 matching) could take longer than the iPhone's 60-second limit. The founder asked
for speed without giving up accuracy, and suggested learning each person's own dishes.

**Decision.**
- **Quick first.** A meal photo is read by the quick model (`meal_quick`) in a few seconds and shown at once. The person
  can add it straight away.
- **Careful after.** At the same time the server starts the careful reading with full IFCT matching (`meal_check_start`)
  and keeps going after it has answered the phone (`EdgeRuntime.waitUntil`), saving the result in `meal_checks`
  (migration 0009, own rows only). The phone asks for it every few seconds (`meal_check_get`), on the Food card or, once
  added, from anywhere (`src/lib/mealChecks.tsx`), even after a restart. The careful numbers replace the quick ones by
  themselves. A number the person changed always stays. After 10 minutes without a result the quick numbers stay.
  Neither step counts as an extra AI request.
- **My dishes** (`src/lib/dishes.ts`), the Food specialist's memory: built from the person's own past meals (last 120
  days) whose numbers were confirmed (IFCT-checked, a usual dish, or corrected by them), per 100 g, newest recipe wins.
  The quick model is told these names and marks a match; Myra then uses the person's own numbers for today's grams
  ("YOURS", "Your usual · from your history") and no careful check is needed. Nothing extra is stored.
- Lines on the card: coral "Myra is double-checking with IFCT…", green "Checked with IFCT 2017" or "Your usual".

**Limits.** Portion grams are still estimated from each photo. A recipe change (more ghee) is caught when the person
corrects a number, which the memory then learns. Myra's chat and typed meals keep the one-step reading for now.
