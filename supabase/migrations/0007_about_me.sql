-- Happy Orange — "About you" (weight, height, sex, age, weight goal) for personal targets (20 Oct 2026).
-- Stored as one JSON value in the person's own profile row; the existing "own profile" policy keeps it private.
alter table public.profiles add column if not exists about jsonb;
