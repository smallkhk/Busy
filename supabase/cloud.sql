-- Abuja Life: cloud save, leaderboards and sending money to friends.
-- Run once in Supabase Dashboard → SQL Editor, after messaging.sql. Safe to re-run.

-- ---------------- Cloud save ----------------
create table if not exists public.saves (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  day int not null default 1,
  -- Recovery code to continue your life on another phone
  code text unique check (code ~ '^[A-Z2-9]{8}$'),
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
drop policy if exists "own save read" on public.saves;
create policy "own save read" on public.saves for select to authenticated using (user_id = auth.uid());
drop policy if exists "own save write" on public.saves;
create policy "own save write" on public.saves for insert to authenticated with check (user_id = auth.uid() and octet_length(data::text) < 400000);
drop policy if exists "own save update" on public.saves;
create policy "own save update" on public.saves for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and octet_length(data::text) < 400000);

-- Load a save with its recovery code (only the exact code works; it never lists other saves).
create or replace function public.load_save_by_code(p_code text)
returns jsonb language sql security definer set search_path = public as $$
  select data from public.saves where code = upper(p_code) limit 1;
$$;
revoke all on function public.load_save_by_code(text) from public, anon;
grant execute on function public.load_save_by_code(text) to authenticated;

-- ---------------- Leaderboards ----------------
create table if not exists public.leaderboard (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 16),
  shirt text not null default '#2f9e6b' check (shirt ~ '^#[0-9a-fA-F]{6}$'),
  net_worth bigint not null default 0 check (net_worth between -100000000 and 100000000000),
  long_leg int not null default 0 check (long_leg between 0 and 100),
  followers int not null default 0 check (followers between 0 and 100000000),
  packaging int not null default 0 check (packaging between 0 and 100),
  day int not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.leaderboard enable row level security;
drop policy if exists "leaderboard readable" on public.leaderboard;
create policy "leaderboard readable" on public.leaderboard for select to authenticated using (true);
drop policy if exists "leaderboard own insert" on public.leaderboard;
create policy "leaderboard own insert" on public.leaderboard for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "leaderboard own update" on public.leaderboard;
create policy "leaderboard own update" on public.leaderboard for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists leaderboard_worth_idx on public.leaderboard (net_worth desc);

-- ---------------- Send money to friends ----------------
create table if not exists public.transfers (
  id bigint generated always as identity primary key,
  sender uuid not null default auth.uid() references auth.users on delete cascade,
  recipient uuid not null references auth.users on delete cascade,
  amount int not null check (amount between 100 and 500000),
  note text check (char_length(note) <= 60),
  claimed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.transfers enable row level security;
drop policy if exists "see my transfers" on public.transfers;
create policy "see my transfers" on public.transfers for select to authenticated using (sender = auth.uid() or recipient = auth.uid());
drop policy if exists "send to friends" on public.transfers;
create policy "send to friends" on public.transfers for insert to authenticated
  with check (sender = auth.uid() and claimed = false and exists (select 1 from public.friends f where f.user_id = auth.uid() and f.friend_id = recipient));
drop policy if exists "claim mine" on public.transfers;
create policy "claim mine" on public.transfers for update to authenticated using (recipient = auth.uid() and claimed = false) with check (recipient = auth.uid());
revoke update on public.transfers from authenticated, anon;
grant update (claimed) on public.transfers to authenticated;
do $$ begin
  alter publication supabase_realtime add table public.transfers;
exception when duplicate_object then null; end $$;
