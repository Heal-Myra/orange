# 0022 · Breathing & meditation: guided pranayama, our own player

Date: 24 Oct 2026 · Decided by: founder

## Decision
- The card offers 5, 10 or 15 minutes and a switch: Guided / On my own (the old timer).
- Guided: Myra's mix (recommended) or one practice: Anulom Vilom, Bhastrika, Kapalbhati, Bhramari, Ujjayi, Sheetali,
  Sama Vritti (box), Udgeeth (Om), Yoga Nidra (lying down). Only the chosen one shows; "Choose another practice" opens the list.
- Myra's mix follows the classic order: energising (Bhastrika, Kapalbhati) → balancing (Anulom Vilom) → calming (Bhramari,
  Udgeeth) → stillness. After 8 pm only calming practices. Plans fill the chosen time exactly (src/lib/pranayama.ts, tested).
- The session (src/app/breathe.tsx) is Happy Orange's own guided "video": a breathing circle that grows and settles with
  each breath, the nostril to use lit for Anulom Vilom, pulses for quick breaths, a short spoken "how to" for each practice
  and Myra's voice on every cue (English or Hindi), voice on/off, pause, end and save. Minutes count to the Soul score.
- Safety: Bhastrika and Kapalbhati show who should skip them (pregnancy, high blood pressure, heart disease, hernia, recent
  surgery; empty stomach; stop if dizzy); Sheetali (cold, cough, asthma). Not medical advice.
- Voice needs the phone build with expo-speech (build 9 onward); before that the session plays with words on screen.

## Meditation goal (added the same day)
"Meditation goal" (folds away in the card): minutes a day to reach (10–60) and by when (1–6 months). The guided length grows
steadily from the person's recent level (average of their last five practice days) to the goal; if recent sessions fall
short of the plan (under 80%), it slows to their pace; never more than 3 minutes above recent practice
(src/lib/meditationPlan.ts, tested). Myra is told today's planned length.

## Voice and language (founder's test on build 10, same day)
"Male voice; needs a female voice; speed too fast; language preference; quality of voice and narration."
- src/lib/voice.ts picks a woman's voice for the language (Indian voices first, Enhanced/Premium preferred, known male voices
  avoided), speaks about 20% slower than normal and pauses between sentences. Used by guided breathing and Yoga Nidra.
- "Voice language" (folds away in the card): English, Hindi or 11 regional languages. Regional lines are translated by Myra once
  (`translate_lines`) and kept on the phone (src/lib/guideText.ts). If the phone has no voice for the language, words show.
- Softer cue wording; every cue for the first three rounds, then every third round.
- Next step for real quality: natural "neural" voices made on the server (e.g. Indian English and Hindi women's voices) and
  saved as audio, or a recorded human voice. Needs the founder's choice of service and an account key (a Supabase secret).
