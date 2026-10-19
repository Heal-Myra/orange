-- Happy Orange — AI access requests and the founder's admin panel.
-- A signed-in person automatically requests AI access; an admin approves or declines it in the app (Account → Admin).
-- Admins are listed by email in app_admins. Admins can also read all feedback.

create table if not exists public.app_admins (
  email text primary key
);
insert into public.app_admins (email) values ('santosh.jha01@gmail.com') on conflict do nothing;
alter table public.app_admins enable row level security;
drop policy if exists "see own admin row" on public.app_admins;
create policy "see own admin row" on public.app_admins
  for select using (email = lower(auth.jwt() ->> 'email'));

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists (select 1 from public.app_admins where email = lower(auth.jwt() ->> 'email')) $$;

create table if not exists public.ai_access (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text
);
alter table public.ai_access enable row level security;

drop policy if exists "own access: read" on public.ai_access;
create policy "own access: read" on public.ai_access
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "own access: request" on public.ai_access;
create policy "own access: request" on public.ai_access
  for insert with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "own access: delete" on public.ai_access;
create policy "own access: delete" on public.ai_access
  for delete using (auth.uid() = user_id);

drop policy if exists "admin: decide" on public.ai_access;
create policy "admin: decide" on public.ai_access
  for update using (public.is_admin()) with check (public.is_admin());

-- Admins can read all feedback (testers still see only their own).
drop policy if exists "admin: read all feedback" on public.feedback;
create policy "admin: read all feedback" on public.feedback
  for select using (public.is_admin());
