# 0056 — Photos leave the phone clean

Date: 10 Nov 2026 · Founder + Claude

## Decision
Myra's eyes are Claude, which runs on Anthropic's computers, so a photo has to be sent for her to read it. The founder
asked how to keep people's data on their own phone. Options weighed:
1. Clean every photo on the phone before it is sent — **chosen (founder, 10 Nov 2026)**.
2. A choice per person, "Keep on my phone", with a small AI on the phone (weaker advice) — later, not now.

Now (quick update): every JPEG photo the app sends to the AI — meals, Spaces, Myra's chat, Screen Time screenshots,
notebook pages, selfies — has its hidden notes removed first: the place it was taken (GPS), the phone's make and model,
the time, and any EXIF, XMP or IPTC data. Only the picture goes. Done in one place (`call()` in `src/lib/ai.ts` via
`src/lib/jpegClean.ts`), so no feature can forget it. Our server still does not store photos; Claude is used through the
paid service whose data is not used for training.

Next (build 14, needs native code): blur faces on the phone before a Spaces photo is sent.

Also confirmed: **no other AI company** receives people's data (no outside image AI; see 0055).

## Update, 10 Nov 2026: open models on the phone looked at, staying with Claude
Free open vision models that run on the phone (SmolVLM, a small Qwen vision model, Gemma 3n) or on a rented GPU computer (Qwen 2.5 VL,
Pixtral, Gemma 3) were considered. Small phone models give much weaker advice and need a 0.6–2 GB download; big ones need
a rented GPU. **Founder: stick with Claude for the time being.** A "Keep on my phone" choice stays a later idea.
