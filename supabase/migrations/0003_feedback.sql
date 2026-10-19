-- Happy Orange — feedback from testers, sent from the app's "Send feedback" screen.
-- Each person can add and read only their own; the founder reads all of it in the Supabase Table Editor.

create table public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email text,
  area text,
  rating smallint check (rating between 1 and 5),
  message text not null check (char_length(message) between 1 and 4000),
  app_version text,
  created_at timestamptz not null default now()
);

create index feedback_time on public.feedback (created_at desc);

alter table public.feedback enable row level security;

create policy "own feedback: read" on public.feedback
  for select using (auth.uid() = user_id);

create policy "own feedback: add" on public.feedback
  for insert with check (auth.uid() = user_id);
