# 0041 — Pillar scores as rings around the tab icons

Date: 31 Oct 2026 · Founder chose option B of three (now / concentric rings as tabs / one ring around each icon).

## Decision
- Body, Mind and Soul tabs keep their icons (leaf, bulb, flame) inside one thin ring that fills with the pillar's score (0–100) for the day on screen. `src/components/TabRing.tsx`.
- The three circle cards leave Today; the parts of each pillar are seen in its own tab.

## Why not concentric rings as the tabs (option A)
At tab size three rings blur together, the tabs stop being recognisable at a glance, and the bar reads as a chart rather than navigation. One ring per icon keeps the icon readable and still shows the score from every screen (like Apple Fitness).
