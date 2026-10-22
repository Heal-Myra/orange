# 0014 — The usual day, and one thing at a time

Date: 22 October 2026 · Decided by: founder

## Decision
1. **Your usual day** (About you, optional): the person writes their routine in their own words. Myra (AI action
   `routine_plan`) turns it into a timetable of switch-overs (`src/lib/routine.ts`: time, their label, a kind such as
   work, break, meal, family, commute, learning, exercise, reading, sleep; daily, weekdays or weekend).
2. **Five minutes before each switch-over**, Today's recommendation refreshes and puts ONE fitting thing in front of
   the person: a Work to-do on reaching office and at breaks, a Family to-do at family time, Learning on the drive
   home, a meal photo at meals, gratitude on waking, breathing before sleep.
3. **Today shows one thing, titled "Clear your mind"** (not three lines). Myra still writes Body, Mind and Soul lines
   and says which one fits the moment (`pick`); the app shows only that one.
4. **Phone reminders** (iPhone app, from build 7, `expo-notifications`): local notifications at the same moments
   with the same nudge; each to-do is used once and the next one goes with the next moment. Planned on the phone,
   nothing leaves it. Re-planned when the app opens, the list changes or the day changes.

## The founder's day (22 Oct 2026), as an example
Wake 5–6, tea and plan 30 min; walk and exercise until 8; family 8–8:30; drive to office 8:30, reach 9; tea 11;
lunch 1; table tennis 1:30; tea 3; hydration 4:30; leave 6, podcasts while driving 6–7; dinner and family 7–8;
walk 8–8:30; bed and reading 9; sleep 9:30. (He wrote "office 10–6" too; his detailed day says 9–6, which Myra uses.)

## Also
Testers' daily AI cap raised from 20 to 40 (default of `AI_DAILY_LIMIT`), because Myra now refreshes at each switch-over.
