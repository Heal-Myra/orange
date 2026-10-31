# 0035 — Face & beauty: a selfie read for skin care, a guess you confirm, kind words
Date: 31 October 2026 · Status: decided (founder)

Founder: Myra should read a selfie to find out how the person feels, read face, beauty and skin-care points into a new
Face & beauty part of Body, and give two or three witty words on overall wellbeing, "including his mental health".

**What we agreed (founder chose Claude's suggestion).** A face does not reliably show mental health (people smile while sad;
a tired face may be one late night). Calling someone "anxious" or "low" from a photo would often be wrong, could hurt, and
breaks the Orange Book's rules on truthfulness and no medical claims. So:
1. **How do you feel today?** The + takes a selfie (front camera). Myra *suggests* how the person looks ("a little tired.
   Is that right?"). Yes saves it as today's feeling; "No, I'll write it" leaves the words to them. Never filled silently.
2. **Body › Face & beauty** (folded away; optional): dryness, dark circles, puffy eyes, redness, pimples, sun tan, dry lips,
   each Clear, Mild or Noticeable, with arrows against the last reading within 30 days, and 2–3 natural care tips.
   Everyday words only, no medical names. Not scored.
3. **Witty words:** two or three warm, playful words about how the person looks today ("Sunny and rested", "Needs chai & sleep").
   Always kind; never about mental health, looks, age, weight, ethnicity or gender.
4. **Privacy:** the photo is read once by heal-ai (`read_selfie`) and not stored; only the results are saved with the day
   (`DayLog.face`). Myra is told the skin points as care context (`faceLine`).

**How:** `src/lib/face.ts` (tested), `src/components/FaceCard.tsx`, `FeelingCard.tsx` (`selfieReading`), `TextField` `onPhoto`,
`useAttach` front camera option. Quick update; no new native module.

## Update, 31 Oct 2026 (09:02, founder): a score, and remedies in Myra recommends
- The card shows a **skin score out of 100** as a ring (average of the points read: clear 100, mild 60, noticeable 20) with
  the change since the last selfie, and **one bar per point** (green good, amber some, coral needs care) instead of words.
  The skin score is not part of the Body score.
- **Remedies moved out of the card into Myra's suggestions.** The latest selfie within 7 days goes into Myra's context with
  natural remedies per point (`faceLine`, `REMEDY` in `src/lib/face.ts`). Myra recommends makes the Body task a remedy when it
  fits the moment (e.g. "Add spinach to lunch for your dark circles."), and Tomorrow's food includes one or two helpful foods
  and names it in its note.
