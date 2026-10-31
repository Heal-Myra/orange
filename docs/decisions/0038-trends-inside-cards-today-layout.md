# 0038 — Trends only inside a card's details; Today's final layout
Date: 31 October 2026 · Status: decided (founder, after previews)

**Trends.** The D · W · M · Q · Y bar is gone from the top of Today, Body, Mind and Soul ("anyone not interested in trends
doesn't see this button"). Tapping a card's rings (a small "Trends ›" under them) opens that card's own page
(`src/app/trend.tsx`, `CARD_TRENDS`): D shows today's numbers for the card as rings with a key; W, M, Q and Y show only that
card's measures (Food: calories, protein, fibre; Sleep: hours; Movement: steps, active minutes; Clear your mind: focus
to-dos; Breathing: minutes; Phone: social media; Gratitude; Daily Wisdom; Tao; My day: total and Body, Mind, Soul).
Change arrows are soft green when better and grey otherwise, never red.

**Today, top to bottom.** "‹ Good afternoon, Santosh ›" in the day row in place of "Today" (other days show their date);
the AQI line only on bad-air days; My day (total, best, catch up on); Body · Mind · Soul ring circles; one Myra card in
two parts: Myra recommends (starting with the name) and Ask Myra (box, microphone, send, two quick questions).
**How I feel today** moved to the Mind tab, above the habits and Clear your mind.
