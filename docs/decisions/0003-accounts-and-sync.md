# 0003 — Accounts, consent and online saving

Date: 17 October 2026 · Decided by: founder, with Claude

## Decision
- Sign-in by **email link** (Supabase magic link), with a 6-digit code box as a second way in. No passwords for people to forget.
- Supabase's free email service no longer allows editing templates without custom SMTP, and only sends to members of the Supabase organisation. Before public launch, set up a custom email service (SMTP, e.g. Resend) and switch the template to show the 6-digit code.
- After first sign-in, a **privacy consent** screen (DPDP Act, 2023). Consent time and version are stored in `profiles`.
- Entries always save on the device first, then to the person's own rows in Supabase (Mumbai) when signed in and consented.
- People may use the app **without an account**; data then stays on that device.
- **Delete my data** removes all of a person's rows. Removing the sign-in record itself needs a server function (planned with Milestone 4).

## Supabase project
Project **Heal**, ID `vjhzlszubdinmesfvmex`, region ap-south-1 (Mumbai). The publishable key is in `.env` (safe to ship in the app);
row-level security limits every row to its owner. Secret keys are never stored in this repository.

## Founder setup done in the dashboard
- Tables and security rules from `supabase/migrations/0001_init.sql` (run in the SQL Editor, 17 Oct 2026).
- Auth → URL Configuration: Site URL and redirect URL must include the web app address (https://project-heal.expo.app).
