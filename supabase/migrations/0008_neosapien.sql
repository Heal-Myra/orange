-- Happy Orange — NeoSapien (Neo 1) connection (6 Nov 2026; decision 0050).
-- Sign-ins and the day's short suggestions are kept only for the server (service role); the app never reads these
-- tables directly (row level security on, no policies). Deleting the account deletes the connection.
create table if not exists public.neosapien_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text, refresh_token text, expires_at timestamptz,
  pending jsonb, connected_at timestamptz
);
create table if not exists public.neosapien_days (
  user_id uuid references auth.users(id) on delete cascade,
  day date not null, result jsonb, fetched_at timestamptz default now(),
  primary key (user_id, day)
);
create table if not exists public.neosapien_kv (key text primary key, value jsonb);
alter table public.neosapien_links enable row level security;
alter table public.neosapien_days enable row level security;
alter table public.neosapien_kv enable row level security;
