# 0056 — Myra like Claude, Sound bath, Measure day, honest Face & beauty

Date: 13 November 2026 · Status: decided (founder: "Go for all")

- **Myra, Claude-style** (`src/app/myra.tsx`, `src/components/MyraVoice.tsx`): a quiet opening with Myra's orange and a
  greeting by the time of day; ☰ past chats (kept on the phone, latest 30, each deletable; the old single chat moved in
  once); 👁 private chat (not saved, Myra's style note not updated); ✎ new chat; a rounded bar with ＋ · "Type or hold to
  talk" · 🎙 (tap to dictate, or hold and let go) · voice mode, which turns into Send ↑ once something is typed. ＋ opens
  Camera · Photos · Files and Myra's shortcuts: Snap a meal, Handwritten to-do list, Lab report, Send feedback. Voice
  mode is a back-and-forth: Apple's speech recognition listens, Myra answers aloud in her server voice (Google, while the
  trial lasts; the phone's own voice otherwise), then listens again; 🎙 pause, ⌨ back to typing, ✕ end.
- **Sound bath** (`src/app/sound-bath.tsx`, `src/lib/soundBath.ts`, sounds made by `scripts/make-sounds.py`): six
  64-second seamless loops made in code (bowls, temple bells, rain on a tin roof, ceiling fan, sea at night, Om drone at
  136.1 Hz), nothing to license; up to two mixed; 10, 20, 45 minutes or "until I sleep" (45, with a 3-minute fade);
  6-second fade in, 1-minute fade out; counts as meditation (session kind "sound"). A fourth way in Meditation; a row in
  Sleep from 8 pm (rain, until I sleep). The screen stays awake; playing with the phone locked needs the next App Store
  build (expo-audio background playback added to app.json).
- **Measure day** (`src/lib/measure.ts`, `src/components/MeasureDay.tsx`): on the 1st (card shows 1st to 3rd until
  measured) waist at the navel and hips with a soft tape; "since last month" with weight; Myra's one line; a 9 am note on
  the 1st; saved with the day and in the health vault (WaistCircumference, HipCircumference).
- **Face & beauty honesty:** a point the photo cannot show is "unclear" and never counted as clear; fine lines and
  uneven tone or dullness (pollution) added; the AI is told most adult faces show at least mild signs somewhere.
