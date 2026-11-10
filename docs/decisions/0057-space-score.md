# 0057 — Space score (on its own, not in My day)

Date: 10 Nov 2026 · Founder + Claude

## Decision
- Each space gets a **score out of 100 from five fixed checks**, 20 points each (0 = not seen, 10 = partly, 20 = clearly),
  marked by Myra from the photo or video frames. The checks per space are in `CHECKS` in `src/lib/spaces.ts` (e.g.
  kitchen: fruit or vegetables in sight, packaged snacks out of sight, water within reach, clear space to cook, light and
  fresh air). Fixed checks keep it fair: the score rises only when a change can be seen in a new photo.
- Myra also says what the score would be once her 3 changes are made ("With the 3 changes: 90").
- **Spaces score** = the average of the spaces snapped (not-yet-snapped spaces don't count). Shown in Spaces and Profile.
- **Not added to My day** (founder): it will become part of a "health now" score in the wholesome scoring system, to be
  designed the weekend of 14 Nov 2026 (notes: claude/wholesome-scoring-ideas.md in the Project).
- **Nudges:** Saturday and Sunday a Today card for the home space worth improving (lowest score, or the next not snapped)
  and a phone note at 10 am on Saturday; Friday a card and a 4 pm note for the work desk (office). "Not now" hides the card
  for the day.

## Why
The founder: a score for the current photo that goes up when the space becomes healthier or follows Myra's suggestions;
home ideas at the weekend, office ideas on Friday.
