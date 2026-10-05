-- Abuja Life: billboards on the 3D map that players rent for in-game naira.
-- Run once in Supabase Dashboard → SQL Editor, after messaging.sql. Safe to re-run.

create table if not exists public.billboards (
  slot int primary key check (slot between 1 and 200),
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  owner_name text not null check (char_length(owner_name) between 1 and 16),
  body text not null check (char_length(body) between 1 and 40),
  emoji text not null default '📢' check (char_length(emoji) <= 8),
  color text not null default '#e8b04b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.billboards enable row level security;

-- Everybody fit see the ads.
drop policy if exists "billboards readable" on public.billboards;
create policy "billboards readable" on public.billboards for select to authenticated using (true);

-- Rent a free slot (never rented), max 7 days ahead.
drop policy if exists "billboards rent new" on public.billboards;
create policy "billboards rent new" on public.billboards for insert to authenticated
  with check (owner = auth.uid() and expires_at <= now() + interval '7 days 1 hour');

-- Take over an expired slot, or change/extend your own. Never someone else's running ad.
drop policy if exists "billboards rent again" on public.billboards;
create policy "billboards rent again" on public.billboards for update to authenticated
  using (expires_at < now() or owner = auth.uid())
  with check (owner = auth.uid() and expires_at <= now() + interval '7 days 1 hour');
