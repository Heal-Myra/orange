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
