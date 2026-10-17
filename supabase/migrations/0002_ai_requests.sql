-- Project Heal — a record of AI requests, used to cap each person's daily AI use
-- (protects the company's Claude credit) and to see how the AI features are used.

create table public.ai_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);

create index ai_requests_user_time on public.ai_requests (user_id, created_at desc);

alter table public.ai_requests enable row level security;

create policy "own ai requests: read" on public.ai_requests
  for select using (auth.uid() = user_id);

create policy "own ai requests: add" on public.ai_requests
  for insert with check (auth.uid() = user_id);
