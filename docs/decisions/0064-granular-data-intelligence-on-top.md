# 0064 · As granular as we can get; the intelligence is ours

Date: 19 Nov 2026 · Founder: "The data points shall be as granular as we can get and then intelligence layer is what we
build on top of that data that we get at Happy Orange." Also: "in sleep we have only hours slept and quality but ideally it
should have all individual elements Oura uses"; "the moment user integrates any device which feeds data to a card all
manual entry fields should not be visible"; "a user without connected app should have the provision to add data manually".

## Decision
1. Read every detail a device gives and keep it (extends 0055, the health vault). Scores are Happy Orange's own reading of it.
2. Sleep: from Apple Health (Oura, Watch, others) the app now reads, per night, time in bed, minutes to fall asleep, times
   woken, minutes awake, when the night ended, and the night's lowest and average heart rate, HRV, breathing rate and blood
   oxygen, on top of hours and stages. No new permissions (already granted for the vault).
3. Sleep score from a device = seven parts like Oura's (docs/scoring.md). Typed nights keep hours + quality.
4. A card a device feeds shows no typing boxes; without a device the boxes stay (per card: sleep, movement, weight).

## Next
The same for Movement (Oura's activity parts: stay active, move every hour, training volume and frequency, recovery) and a
Readiness-like view from the night's vitals once enough nights are kept.
