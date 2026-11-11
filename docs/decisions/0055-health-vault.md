# 0055 — The health vault: everything from Apple Health, kept for the learning engine

Date: 11 November 2026 · Status: decided (founder: "why are we selective … make a repository of all user data")

**Decision.** Happy Orange reads everything Apple Health offers, not only what today's cards use, and keeps it in the
person's own rows on our server (Mumbai), so the learning engine we build later can relate food to sleep, running,
weight and the rest. Apple Health is the door for every device: Apple Watch, iPhone, scales, Oura, Whoop, Garmin.

- **What:** 60 quantities as daily figures (`health_daily`: sum for totals; average, min, max for readings), every
  workout with distance, energy, source and Apple's details (`health_workouts`), and every event: sleep stages, mindful
  sessions, stand hours, heart-rate alerts (`health_events`). Lists in `src/lib/health.ios.ts` (`VAULT_METRICS`,
  `VAULT_EVENTS`). Reproductive health is not read.
- **How:** `src/lib/healthVault.ts`, after each Apple Health sync, at most every 6 hours: the first time two years back,
  30 days at a time, in the background; then the last 3 days again (late Watch data). Upserts on Apple's ids, so nothing
  is stored twice. Migration 0010; each person reads and writes only their own rows.
- **Permission:** HEALTH_READ_VERSION 3, so people who connected earlier see Apple's sheet once more for the new items.
- **Privacy:** the Privacy page says so; Delete my data removes the vault too.
- **Later:** per-workout heart rate and minute-level series are not stored yet (daily figures are enough to start);
  NeoSapien and other connectors can write to the same vault.
