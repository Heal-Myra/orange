-- The careful check of a meal photo (decision 0053): the server writes the result here while the phone shows the quick
-- reading; the phone asks for it by id. Each person sees only their own rows. Safe to run again.
create table if not exists public.meal_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  status text not null default 'running', -- running · done · failed
  result jsonb,
  created_at timestamptz not null default now()
);
alter table public.meal_checks enable row level security;
do $$ begin
  create policy "own meal checks" on public.meal_checks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
