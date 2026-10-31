# 0037 — One design for every scored card: rings, details at the side, Myra at the bottom
Date: 31 October 2026 · Status: decided (founder)

Founder: "design all cards with objective scores and elements as concentric circles like Face & beauty" and "the common
theme shall be score rings, their individual details at side and bottom Myra recommends". For writing cards he chose
"text boxes at the bottom" (over boxes beside the rings, which get too narrow for sentences).

**Every scored card, top to bottom**
1. Title and the score as a soft pill (top right). Data cards show whole numbers; the journal keeps its halves (7.5).
2. **Concentric rings**, one per element, filled by progress; the card's score in the middle.
   - Data cards (photo, Apple Health): the **key at the side**: dot, name, done / target.
   - Writing cards: rings centred on top; the **writing boxes below**, each headed by its ring's dot, the prompt and points.
3. The card's own controls (snap a meal, start a session, add a to-do); details and typing fold into "Details" once there is data.
4. **Myra's line at the bottom**: her latest recommendation when it is about this card, otherwise a ready-made next step from
   the card's numbers (`src/components/MyraLine.tsx`; no extra AI request).

**Cards and their rings.** Food: calories, protein, fibre (table, calorie sources and meals under "See details").
Sleep: hours (of 8), deep sleep (of 1.5 h, when the watch gives it), quality (of 5). Movement: steps, active minutes, active
energy. Face & beauty: best point and top three concerns. Clear your mind: first and second focus to-do. Breathing &
meditation: minutes today. Phone activity: content quality (of 18), within the limit (of 12). Gratitude journal: thankful
for, made me laugh, I was kind to, best part of my day. Daily Wisdom and Tao: studied, lived.

**Colours.** Shared soft pastels (`PASTEL` in `src/components/Rings.tsx`: peach, lavender, teal, sky, sand, rose, sage), no red;
the coloured left edges on cards were removed. Scoring itself is unchanged.

## Update, 31 Oct 2026 (12:14, founder): Today's card in the same design
"My day" replaces the old three-part circle: rings for **your best** part of the day and the **three biggest concerns**
(across Food, Sleep, Movement, To-dos, Breathing, Phone, Gratitude, Daily Wisdom, Tao; parts not logged count as 0), the
total out of 300 in the middle, the band ("Finding your footing") at the top right in grey, and **Myra recommends** inside
the bottom of the card (`GuidanceCard embedded`). Tapping a key row opens that card. The Body, Mind and Soul tiles stay below.
- **Body, Mind and Soul as ring circles** (founder, 13:21, after seeing a preview): three white circles under My day replace
  the coloured tiles; each has a ring per part (Body: food, sleep, movement; Mind: to-dos, breathing, phone; Soul:
  gratitude, Daily Wisdom, Tao) and the pillar's score out of 100 in the middle. Tap opens the tab. Founder's rule from
  now on: show a picture before building a visual change.
- **Today's order and the Myra card** (founder, 13:36 and 13:41, after a preview): My day (total, best, catch up on) →
  Body · Mind · Soul ring circles → one **Myra card**: her sign, "Your guide · Updated hh:mm", refresh; one recommendation as a
  horizontal row that starts with the person's name ("Santosh, snap your lunch…"); "Ask Myra anything…" with the chat sign,
  microphone and send (opens her chat with the question sent, or listening); two quick questions. The floating Myra button
  is hidden on Today only. The AQI line under the name shows only when AQI is above 100.
