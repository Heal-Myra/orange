# 0020 · To-do: today's list, habits, three a day per group

Date: 23 Oct 2026 · Decided by: founder

## Decision
- Clear your mind (Mind tab) shows today's to-dos only (due today or overdue); "See all (n later)" shows the rest. The group
  chips count today's to-dos.
- At most three to-dos a day in each group (Family, Work, Better me). A full day sends a new task to the next day with room,
  and says so. The morning re-plan keeps today's tasks and moves only overdue or undated ones, with the same limit
  (src/lib/taskPlan.ts, tested).
- Adding a task offers Once · Daily · Weekdays · Weekly, read automatically from the words ("Call Dad daily at 9 AM" → Daily,
  09:00). A repeating task is a habit: it does not enter the to-do list but the Habits bar above it, ticked off each day.
  An existing task that reads like a habit shows "This repeats. Make it a habit".
- At a habit's time (from five minutes before, for an hour, until ticked) it is the one thing on Today's Clear your mind,
  with a tick; a phone reminder five minutes before (builds with reminders). Myra is told today's habits.
- Habits are saved with About you (profiles.about), so they sync with the account; ticks are saved on the day (habitsDone).

## Update, 26 Oct 2026: habits on Myra recommends, and 21 days of "Making a habit"
Founder: once a daily task is recorded it pops up on Myra recommends directly, and for 21 days it shows under a
"Making a habit" part of the Clear your mind card. Every habit due today stays on Myra recommends from its time (five
minutes before) until ticked; without a time, all day. It sits above Myra's own line instead of replacing it. Days 1–21
live in Making a habit (`forming`, `habitDay`, `timesDone` in src/lib/habits.ts); from day 22 the habit moves to the
Habits card.

Update, 27 Oct 2026: personal/professional tags were considered (three options) and the founder chose to keep the three groups as they are. Myra shows only Work-group to-dos during office hours (26 Oct rule); personal projects go in Better me.
