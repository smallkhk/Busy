-- Abuja Life: game owner tools (admin panel, bans, announcements, gifts).
-- Run once in Supabase Dashboard → SQL Editor, after messaging.sql, billboards.sql and cloud.sql. Safe to re-run.
--
-- Make yourself admin (copy your Player ID from ⚙️ Account in the game):
--   insert into public.admins (user_id) values ('PASTE-YOUR-PLAYER-ID-HERE');

-- ---------------- Who be admin ----------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- Nobody fit read or change this list from the game. Add admins with the SQL above.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------- Bans ----------------
create table if not exists public.bans (
  user_id uuid primary key references auth.users on delete cascade,
  reason text not null default '' check (char_length(reason) <= 120),
  created_at timestamptz not null default now()
);
alter table public.bans enable row level security;
drop policy if exists "see own ban" on public.bans;
create policy "see own ban" on public.bans for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin bans" on public.bans;
create policy "admin bans" on public.bans for insert to authenticated with check (public.is_admin());
drop policy if exists "admin unbans" on public.bans;
create policy "admin unbans" on public.bans for delete to authenticated using (public.is_admin());

create or replace function public.is_banned() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bans where user_id = auth.uid());
$$;
revoke all on function public.is_banned() from public, anon;
grant execute on function public.is_banned() to authenticated;

-- Banned players can still play alone, but cannot text, rent billboards, send money or enter the rankings.
drop policy if exists "banned no text" on public.messages;
create policy "banned no text" on public.messages as restrictive for insert to authenticated with check (not public.is_banned());
drop policy if exists "banned no ads" on public.billboards;
create policy "banned no ads" on public.billboards as restrictive for insert to authenticated with check (not public.is_banned());
drop policy if exists "banned no ads update" on public.billboards;
create policy "banned no ads update" on public.billboards as restrictive for update to authenticated using (not public.is_banned());
drop policy if exists "banned no transfers" on public.transfers;
create policy "banned no transfers" on public.transfers as restrictive for insert to authenticated with check (not public.is_banned() or public.is_admin());
drop policy if exists "banned no rank" on public.leaderboard;
create policy "banned no rank" on public.leaderboard as restrictive for insert to authenticated with check (not public.is_banned());
drop policy if exists "banned no rank update" on public.leaderboard;
create policy "banned no rank update" on public.leaderboard as restrictive for update to authenticated using (not public.is_banned());

-- ---------------- Admin clean-up powers ----------------
drop policy if exists "admin removes ads" on public.billboards;
create policy "admin removes ads" on public.billboards for delete to authenticated using (public.is_admin());
drop policy if exists "admin removes rank" on public.leaderboard;
create policy "admin removes rank" on public.leaderboard for delete to authenticated using (public.is_admin());
drop policy if exists "admin renames" on public.profiles;
create policy "admin renames" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
-- A name the admin changed stays changed: the player's game cannot put the old one back.
alter table public.profiles add column if not exists name_locked boolean not null default false;
create or replace function public.keep_admin_name() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    if tg_table_name = 'profiles' and new.name is distinct from old.name then new.name_locked := true; end if;
    return new;
  end if;
  if tg_table_name = 'profiles' then
    new.name_locked := old.name_locked;
    if old.name_locked then new.name := old.name; end if;
  elsif exists (select 1 from public.profiles p where p.id = new.user_id and p.name_locked) then
    new.name := (select p.name from public.profiles p where p.id = new.user_id);
  end if;
  return new;
end $$;
drop trigger if exists keep_admin_name on public.profiles;
create trigger keep_admin_name before update on public.profiles for each row execute function public.keep_admin_name();
drop trigger if exists keep_admin_name on public.leaderboard;
create trigger keep_admin_name before insert or update on public.leaderboard for each row execute function public.keep_admin_name();

-- Admin gifts: drop money for any player (they collect am like a normal transfer).
drop policy if exists "admin gifts" on public.transfers;
create policy "admin gifts" on public.transfers for insert to authenticated with check (sender = auth.uid() and public.is_admin());

-- ---------------- Announcements (and world events for everybody) ----------------
create table if not exists public.announcements (
  id bigserial primary key,
  body text not null check (char_length(body) between 1 and 200),
  -- Optional world news id (e.g. 'fuel-hike') wey go hit every player.
  news text check (news is null or char_length(news) <= 40),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '3 days'
);
alter table public.announcements enable row level security;
drop policy if exists "announcements readable" on public.announcements;
create policy "announcements readable" on public.announcements for select to authenticated using (expires_at > now() or public.is_admin());
drop policy if exists "admin announces" on public.announcements;
create policy "admin announces" on public.announcements for insert to authenticated with check (public.is_admin());
drop policy if exists "admin removes announcement" on public.announcements;
create policy "admin removes announcement" on public.announcements for delete to authenticated using (public.is_admin());
do $$ begin
  alter publication supabase_realtime add table public.announcements;
exception when duplicate_object then null; end $$;

-- ---------------- Dashboard numbers ----------------
create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not admin'; end if;
  return json_build_object(
    'players', (select count(*) from public.profiles),
    'active_today', (select count(*) from public.profiles where updated_at > now() - interval '1 day'),
    'active_week', (select count(*) from public.profiles where updated_at > now() - interval '7 days'),
    'new_today', (select count(*) from auth.users where created_at > now() - interval '1 day'),
    'messages_today', (select count(*) from public.messages where created_at > now() - interval '1 day'),
    'ads_running', (select count(*) from public.billboards where expires_at > now()),
    'saves', (select count(*) from public.saves),
    'banned', (select count(*) from public.bans),
    'richest', (select coalesce(max(net_worth), 0) from public.leaderboard)
  );
end $$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- Find players by name or by the #TAG the game shows.
create or replace function public.admin_players(q text) returns table (
  id uuid, name text, shirt text, last_seen timestamptz, joined timestamptz, net_worth bigint, day int, banned boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not admin'; end if;
  return query
    select p.id, p.name, p.shirt, p.updated_at, u.created_at, l.net_worth, l.day, exists (select 1 from public.bans b where b.user_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.leaderboard l on l.user_id = p.id
    where q = '' or p.name ilike '%' || q || '%' or replace(p.id::text, '-', '') ilike ltrim(q, '#') || '%'
    order by p.updated_at desc
    limit 50;
end $$;
revoke all on function public.admin_players(text) from public, anon;
grant execute on function public.admin_players(text) to authenticated;
