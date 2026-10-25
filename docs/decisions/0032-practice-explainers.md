# 0032 — Breathing explainers: one practice model, a guide character, later a camera check

Date: 25 October 2026 · Status: decided (founder)

Founder: our own explainer videos, professional, minimalist; and later the person turns on their camera and the AI
corrects their practice live.

**Decision.** Not AI-generated video: it has no knowledge of what is correct, fixed timing, frequent hand and finger
errors, and could not be reused by a camera check. Instead:
1. **Practice data** (`src/lib/practiceGuide.ts`): each practice as steps with pose (right/left hand, mouth), breath
   (in/out/hold/pump/hum/chant, and through which nostril), seconds and Myra's line; `checksFor(step)` lists what a correct
   practice looks like at that moment (spine upright, thumb on right nostril…). This is our core IP.
2. **Guide character** drawn and moved from that data (`src/lib/guideFigure.ts`, `src/components/GuideFigure.tsx`),
   played by `src/app/explain.tsx` ("How to do it" on the practice in Breathing & meditation and in the session intro),
   narrated by Myra's natural voice. The current drawing is a placeholder.
3. **Professional character:** the founder's friend (animated films) designs a minimalist rigged character in Rive with
   named poses matching the data; Happy Orange owns it (written assignment). It replaces the placeholder without changing
   the data.
4. **Camera check (later):** on-phone body and hand tracking (nothing uploaded) compared against `checksFor`, plus the
   microphone for humming, Om and Kapalbhati pumps.
AI video may still be used for marketing (App Store previews, social posts).
