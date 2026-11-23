# 0066 — Today's sky follows local sunrise and sunset

Date: 23 Nov 2026 · Decided by: founder

## Decision
Today's Ganga scene changes colour through the day (dawn, Oura-like morning blue, midday, dusk, night). The timing is set by the sunrise and sunset of the person's location, not fixed clock hours.

## How
- `src/lib/sun.ts`: NOAA solar formula on the device (no network). `skyHour()` bends the clock so local sunrise maps to the dawn key (6.2) and sunset to dusk (18) in `skyAt()` (DuskScene.tsx).
- Location: the latitude/longitude saved with the latest air reading (rounded to ~1 km). Without one, the plain clock is used.
- The Today header is transparent at rest and takes `skyTop()` once scrolled; the profile button is a three-line glass circle on the right.

## Why
Oura's time-of-day sky feels alive; following the real sun keeps it true in every city and season.
