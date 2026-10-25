# 0030 — Myra's natural voice: made once with Google, kept in our own storage

Date: 25 October 2026 · Status: decided (founder)

**Problem.** The iPhone's own voices sounded male and fast in testing, and many phones have no Gujarati, Tamil or Bengali voice
at all, so regional sessions were silent ("words only").

**Options looked at.** Sarvam AI (Indian, cheap), Google Cloud Text-to-Speech, Microsoft Azure, ElevenLabs, a recorded voice
artist, or staying with the phone's voices. The founder was wary of adding vendors; he chose Google (free trial credit of
₹28,797 until 24 Jan 2027; no charge unless he clicks Upgrade).

**Decision.** Google is used only to *make* audio, never as a live part of the app:
- Server function `supabase/functions/voice` makes each spoken sentence once with Google's Chirp 3 HD woman's voice
  (default `Aoede`, speed 0.85; secrets `VOICE_NAME`, `VOICE_RATE` change them) and saves it as an MP3 in the public
  Supabase Storage bucket `voice` (`<locale>/<voice>-<rate>/<hash>.mp3`). Later requests find the file and skip Google.
- The key is the `GOOGLE_TTS_KEY` Supabase secret, restricted in Google Cloud to the Text-to-Speech API only.
- The phone (build 11 onward, `expo-audio`) asks for the files when a session opens ("Preparing Myra's voice…"), remembers
  their addresses, and plays them sentence by sentence with a short pause. Older builds, offline, or Odia and Assamese
  (no Google voice yet) use the phone's own voice as before (`src/lib/voice.ts`).
- Languages with the natural voice: English (India), Hindi, Marathi, Bengali, Gujarati, Punjabi (Google preview), Tamil,
  Telugu, Kannada, Malayalam, Urdu.

**Leaving Google later.** All files already made stay in our storage. To switch vendor, change only the `make()` step in the
server function. Reminders are set for 8 Nov 2026 and 15 Jan 2027 to close the Google Cloud account when we are done.
