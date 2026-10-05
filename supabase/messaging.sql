-- Abuja Life: friends and private messages.
-- Run once in Supabase Dashboard → SQL Editor. Safe to re-run.
-- Requires: Authentication → Sign In / Providers → "Allow anonymous sign-ins" ON.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 16),
  shirt text not null default '#2f9e6b' check (shirt ~ '^#[0-9a-fA-F]{6}$'),
  updated_at timestamptz not null default now()
);

create table if not exists public.friends (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  friend_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  sender uuid not null default auth.uid() references auth.users on delete cascade,
  recipient uuid not null references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_recipient_idx on public.messages (recipient, created_at desc);
create index if not exists messages_sender_idx on public.messages (sender, created_at desc);
create index if not exists profiles_name_idx on public.profiles (lower(name));

alter table public.profiles enable row level security;
alter table public.friends enable row level security;
alter table public.messages enable row level security;

-- Profiles: any signed-in player can look people up; you can only write your own.
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Friends: you see rows that involve you; you add and remove your own.
drop policy if exists "see my friendships" on public.friends;
create policy "see my friendships" on public.friends for select to authenticated using (user_id = auth.uid() or friend_id = auth.uid());
drop policy if exists "add friend" on public.friends;
create policy "add friend" on public.friends for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "remove friend" on public.friends;
create policy "remove friend" on public.friends for delete to authenticated using (user_id = auth.uid());

-- Messages: only sender and recipient can read; you can only text people you added.
drop policy if exists "read my messages" on public.messages;
create policy "read my messages" on public.messages for select to authenticated using (sender = auth.uid() or recipient = auth.uid());
drop policy if exists "text my friends" on public.messages;
create policy "text my friends" on public.messages for insert to authenticated
  with check (sender = auth.uid() and exists (select 1 from public.friends f where f.user_id = auth.uid() and f.friend_id = recipient));
drop policy if exists "mark read" on public.messages;
create policy "mark read" on public.messages for update to authenticated using (recipient = auth.uid()) with check (recipient = auth.uid());

-- Recipients may only touch read_at, never the message text.
revoke update on public.messages from authenticated, anon;
grant update (read_at) on public.messages to authenticated;

-- Live delivery of new messages.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
