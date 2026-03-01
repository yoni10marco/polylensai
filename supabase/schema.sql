-- ============================================================
-- PolyLens AI — Full Database Schema
-- Run once in Supabase SQL Editor
-- ============================================================

-- ─── 1. PROFILES ────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  tier text default 'free',        -- 'free' | 'pro'
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── 2. WATCHLISTS ──────────────────────────────────────────
drop table if exists public.watchlists cascade;
create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  condition_id text not null,
  market_title text,
  created_at timestamptz default now(),
  unique(user_id, condition_id)
);

alter table public.watchlists enable row level security;

drop policy if exists "Users manage own watchlist" on public.watchlists;
create policy "Users manage own watchlist" on public.watchlists
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── 3. NEWS ANALYSES CACHE ─────────────────────────────────
create table if not exists public.news_analyses (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  analysis jsonb not null,
  created_at timestamptz default now()
);

alter table public.news_analyses enable row level security;

drop policy if exists "Public read news analyses" on public.news_analyses;
create policy "Public read news analyses" on public.news_analyses
  for select using (true);

drop policy if exists "Service insert news analyses" on public.news_analyses;
create policy "Service insert news analyses" on public.news_analyses
  for insert with check (true);

-- ─── 4. USER USAGE (Rate Limiting) ──────────────────────────
create table if not exists public.user_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  messages_today int default 0,
  last_message_date date default current_date,
  updated_at timestamptz default now()
);

alter table public.user_usage enable row level security;

drop policy if exists "Users manage own usage" on public.user_usage;
create policy "Users manage own usage" on public.user_usage
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── 5. SET YOUR ACCOUNT TO PRO ─────────────────────────────
-- Step 1: find your user ID
--   select id, email from auth.users;
--
-- Step 2: uncomment and run with your actual UUID:
--   insert into public.profiles (id, tier)
--   values ('YOUR-USER-UUID-HERE', 'pro')
--   on conflict (id) do update set tier = 'pro';
