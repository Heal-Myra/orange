# 0017 · Guided Yoga Nidra at bedtime

Date: 22 Oct 2026 · Decided by: founder ("recommend a Yoga Nidra session and take them to a guided session"; "after sleep time has crossed, everything should be towards winding down and putting the user to sleep")

## Decision
- After the usual sleep time (or 9:30 pm without a usual day), Clear your mind shows only one thing, set by the app and not by
  the AI: "Lie down for Yoga Nidra, then drift into sleep." Tapping it opens the guided session. The bedtime phone reminder
  says the same and opens the session when tapped.
- The session (src/app/yoga-nidra.tsx) reads our own script (src/lib/yogaNidra.ts, English and Hindi, about 14 minutes)
  in the phone's own voice (expo-speech), with silences between steps; dark screen kept awake; minutes count toward
  Breathing & meditation. At bedtime it ends by letting the person fall asleep; in the day it brings them gently back.
- Also on the Soul tab: "Guided Yoga Nidra, lying down (15 min)" in Breathing & meditation.
- The voice needs build 9 (expo-speech, expo-keep-awake). Older builds show the words on screen at the same pace.

## Later
A recorded human voice (founder or a teacher) would feel warmer than the phone's voice; the script is ready for it.
