# 0054 — Missed-meal nudge, protein top-up, 30-day one-change test

Date: 10 November 2026 · Status: decided (founder picked ideas 1, 4 and 10 of 10 Nov)

- **Missed-meal nudge** (Food specialist; `src/lib/missedMeal.ts`, `MissedMeal.tsx`, `Reminders.tsx`): at 2 pm with no
  lunch logged (a meal logged 11 am–4 pm) and 9:30 pm with no dinner (5 pm–midnight), a phone notification and a row in
  Food: Snap (camera), Skipped, Ate, no photo (opens Type). Not on a fasting day. **Skipped carries no penalty** and
  stops the nudge (founder asked to choose; recommendation taken: honesty is never punished). Notifications are now
  planned for everyone, not only people with a usual day.
- **Protein top-up** (Food specialist; `src/lib/proteinTopUp.ts`, `ProteinTopUp.tsx`): from 6 pm, when something is
  logged, not fasting, and protein is under 80 % of the aim: protein so far, one line ("Add sprouts chaat for about 11 g")
  and three picks. Up to two of the person's own protein-rich dishes ("My dishes", decision 0053) come first, then
  everyday foods (IFCT values, rounded). Vegetarian unless About you mentions eggs, chicken, fish, meat or non-veg.
  Tapping a pick logs it, once eaten.
- **30-day one-change test** (Myra coordinates; `src/lib/oneChange.ts`, `OneChange.tsx` on Today, folded): one change,
  kept with About you so it syncs; one tap a day (Kept today / Not today). From day 30: sleep, Body score, My day and mood
  (1–5), the 14 days before the start against days 17–30, with how many days were kept. Myra says it helped when at least
  two of them rose by more than 3 %.
- Idea 8 (kinder words to yourself) was not picked for now.
