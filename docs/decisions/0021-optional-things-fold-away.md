# 0021 · Design rule: anything optional folds away in its section's card

Date: 23 Oct 2026 · Decided by: founder ("anything which is optional shall be expandable and collapsible in the card of the
major sub-segment where it belongs"; "the app is always neat and small and brings in detail when required — minimalism")

## Rule
Optional features are not cards of their own. Each is one small row inside the card of the section it belongs to: an icon,
its name and a one-line status (e.g. "Not planned yet", "+15 · How tides work"). Tap to open the details; tap to fold.
Built once as `Expandable` (src/components/ui.tsx) and reused.

## Applied
- Food card: Tomorrow's food (clock row) — was a separate card.
- Phone activity: Learning (opens by itself when a shared link is being read by Myra).
- Tao practice: My note (private).
New optional features follow the same rule.
