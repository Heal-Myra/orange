# 0046 — Myra takes anything you drop in

Date: 1 Nov 2026 · Founder: "user can upload anything here and Myra picks it up and uploads the data in the relevant section … and asks in the chat can I add it to my day."

## Decision
- In Myra's chat, a picture is first classified by the server (`what_is_this`, quick model): meal, screen_time, todo, journal, selfie or other (with how sure). Below 0.5 or "other": Myra talks about it as before.
- Otherwise the card's own reader runs (meal_photo, screen_time, read_note tasks/journal, read_selfie) and Myra shows a summary, where it will go, and two buttons: Add to my day, No. `src/lib/smartUpload.ts` applies it the same way each card does (meals with their time; phone sessions on the day the screenshot shows; to-dos and habits; journal fills empty boxes only; Face & beauty for today).
- Nothing is added without a yes; everything can be changed on its card afterwards. Pictures are read once and not stored.
- The Ask Myra box rotates its hint to show what can be dropped in (`src/lib/rotatingHint.ts`).
