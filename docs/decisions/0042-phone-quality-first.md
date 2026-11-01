# 0042 — Phone activity: quality first, time as a penalty

Date: 1 Nov 2026 · Founder: "quality is more important … penalise the score if duration exceeds the recommended level … show it only when it is out of limit."

## Decision
- Phone points (30) = 30 × quality − (social and video minutes over the limit) ÷ 10, never below 0. Quality is unchanged: minutes weighted by the kind of content. Learning and AI tools never count toward the limit; everyday tools and "Not me" are not scored.
- The card shows the feelings (what you fed your mind) as rings around the score; time appears only when over the limit, as one line with the points it cost.
- Pasting uses Apple's UIPasteControl (`ClipboardPasteButton` from expo-clipboard), which does not trigger the "Allow Paste" prompt. Elsewhere (web, older iOS) a normal Paste button remains.

## Example
Quality 17/18 of the old scale (0.94) → 28.3; 96 minutes against 60 → 36 over → −3.6 → 25 of 30.
