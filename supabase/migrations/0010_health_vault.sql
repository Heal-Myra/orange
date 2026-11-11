-- The health vault (founder, 11 Nov 2026): everything a person's health devices share through Apple Health, kept for
-- the future learning engine (food against sleep, running, weight …). Each person sees and writes only their own rows.
-- Safe to run again.
create table if not exists public.health_daily (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  metric text not null,          -- Apple Health name without its prefix, e.g. StepCount, HeartRate
  unit text not null,
  sum double precision,          -- for counts and totals (steps, kcal, km)
  avg double precision, min double precision, max double precision, -- for readings (heart rate, weight)
  updated_at timestamptz not null default now(),
  primary key (user_id, date, metric)
);
create table if not exists public.health_workouts (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,              -- Apple Health's own id, so a workout is never stored twice
  type text not null, start_at timestamptz not null, end_at timestamptz not null,
  minutes double precision, km double precision, kcal double precision, source text, meta jsonb,
  primary key (user_id, id)
);
create table if not exists public.health_events (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  kind text not null,            -- SleepAnalysis, MindfulSession, AppleStandHour, heart alerts
  value double precision,        -- sleep: 0 in bed, 1 asleep, 2 awake, 3 core, 4 deep, 5 REM
  start_at timestamptz not null, end_at timestamptz not null, source text,
  primary key (user_id, id)
);
create index if not exists health_daily_metric on public.health_daily (user_id, metric, date);
create index if not exists health_events_kind on public.health_events (user_id, kind, start_at);
alter table public.health_daily enable row level security;
alter table public.health_workouts enable row level security;
alter table public.health_events enable row level security;
do $$ begin create policy "own health daily" on public.health_daily for all using (user_id = auth.uid()) with check (user_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "own health workouts" on public.health_workouts for all using (user_id = auth.uid()) with check (user_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "own health events" on public.health_events for all using (user_id = auth.uid()) with check (user_id = auth.uid()); exception when duplicate_object then null; end $$;
