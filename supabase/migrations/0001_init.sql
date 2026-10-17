-- Project Heal — initial database (Milestone 2).
-- Every row belongs to one person. Row-level security makes sure a person can only
-- ever read or change their own rows, even if the app has a bug.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  kcal integer not null default 2000,
  protein integer not null default 70,
  steps integer not null default 8000,
  active integer not null default 30,
  meditation integer not null default 20,
  media_limit integer not null default 60,
  consent_at timestamptz,            -- when the person agreed to the privacy notice (DPDP Act, 2023)
  consent_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per person per day. The day's log is stored as JSON matching src/lib/types.ts (DayLog),
-- so the app and database stay in step while the product is young.
create table public.day_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  log jsonb not null,
  body_score numeric(5, 2),
  mind_score numeric(5, 2),
  soul_score numeric(5, 2),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index day_logs_user_day on public.day_logs (user_id, day desc);

alter table public.profiles enable row level security;
alter table public.day_logs enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own day logs" on public.day_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
