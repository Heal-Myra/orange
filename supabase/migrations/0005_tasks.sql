-- Happy Orange — "Clear your mind" to-do list (Family, Work, Better me).
-- Each person reads and changes only their own tasks. Task ids are made on the phone so it works offline.

create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  area text not null check (area in ('family', 'work', 'self')),
  due date,
  done_at timestamptz,
  moved integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user on public.tasks (user_id);

alter table public.tasks enable row level security;

create policy "own tasks: read" on public.tasks for select using (auth.uid() = user_id);
create policy "own tasks: add" on public.tasks for insert with check (auth.uid() = user_id);
create policy "own tasks: change" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks: remove" on public.tasks for delete using (auth.uid() = user_id);
