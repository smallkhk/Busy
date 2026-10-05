import { create } from 'zustand';
import { cleanText } from './filter';
import { getClient } from './supabase';

export type AdminStats = {
  players: number;
  active_today: number;
  active_week: number;
  new_today: number;
  messages_today: number;
  ads_running: number;
  saves: number;
  banned: number;
  richest: number;
};

export type AdminPlayer = { id: string; name: string; shirt: string; last_seen: string; joined: string; net_worth: number | null; day: number | null; banned: boolean };

export type Announcement = { id: number; body: string; news: string | null; created_at: string; expires_at: string };

type AdminState = {
  /** Only true when Supabase says this player is in public.admins. */
  isAdmin: boolean;
  banned: boolean;
  announcements: Announcement[];
};

export const useAdmin = create<AdminState>(() => ({ isAdmin: false, banned: false, announcements: [] }));

const SETUP_MSG = 'Admin tools never set up. Run supabase/admin.sql';
const explain = (e: { message: string } | null) => (!e ? null : /function|does not exist|schema cache|relation/i.test(e.message) ? SETUP_MSG : e.message);

let onAnnounce: ((a: Announcement) => void) | null = null;
/** Lets the game show new announcements (and start their world news). */
export const setAnnounceHandler = (fn: typeof onAnnounce) => (onAnnounce = fn);

let started = false;

/** Check admin and ban status, load announcements and listen for new ones. */
export async function initAdmin() {
  const c = getClient();
  if (!c || started) return;
  started = true;
  const [admin, banned, list] = await Promise.all([
    c.rpc('is_admin'),
    c.rpc('is_banned'),
    c.from('announcements').select('*').order('created_at', { ascending: false }).limit(10),
  ]);
  const announcements = (list.data ?? []) as Announcement[];
  useAdmin.setState({ isAdmin: admin.data === true, banned: banned.data === true, announcements });
  for (const a of [...announcements].reverse()) onAnnounce?.(a);
  c.channel('announcements')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, ({ new: a }) => {
      const ann = a as Announcement;
      useAdmin.setState((s) => ({ announcements: [ann, ...s.announcements.filter((x) => x.id !== ann.id)].slice(0, 10) }));
      onAnnounce?.(ann);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'announcements' }, ({ old }) => {
      const id = (old as { id?: number }).id;
      useAdmin.setState((s) => ({ announcements: s.announcements.filter((x) => x.id !== id) }));
    })
    .subscribe();
}

export async function fetchStats(): Promise<AdminStats | string> {
  const c = getClient();
  if (!c) return 'You need internet';
  const { data, error } = await c.rpc('admin_stats');
  return explain(error) ?? (data as AdminStats);
}

export async function findPlayers(q: string): Promise<AdminPlayer[] | string> {
  const c = getClient();
  if (!c) return 'You need internet';
  const { data, error } = await c.rpc('admin_players', { q: q.trim() });
  return explain(error) ?? ((data ?? []) as AdminPlayer[]);
}

export async function banPlayer(id: string, reason: string): Promise<string | null> {
  const c = getClient();
  if (!c) return 'You need internet';
  const { error } = await c.from('bans').insert({ user_id: id, reason: cleanText(reason, 120) });
  return explain(error);
}

export async function unbanPlayer(id: string): Promise<string | null> {
  const c = getClient();
  if (!c) return 'You need internet';
  const { error } = await c.from('bans').delete().eq('user_id', id);
  return explain(error);
}

export async function renamePlayer(id: string, name: string): Promise<string | null> {
  const c = getClient();
  const clean = cleanText(name, 16);
  if (!c) return 'You need internet';
  if (!clean) return 'Name empty';
  const { error } = await c.from('profiles').update({ name: clean }).eq('id', id);
  if (!error) await c.from('leaderboard').update({ name: clean }).eq('user_id', id);
  return explain(error);
}

export async function removeFromRankings(id: string): Promise<string | null> {
  const c = getClient();
  if (!c) return 'You need internet';
  const { error } = await c.from('leaderboard').delete().eq('user_id', id);
  return explain(error);
}

/** Gift in-game money; the player collects it like a normal transfer. */
export async function giftPlayer(id: string, amount: number, note: string): Promise<string | null> {
  const c = getClient();
  if (!c) return 'You need internet';
  if (amount < 100 || amount > 500000) return 'Between ₦100 and ₦500,000 per gift';
  const { error } = await c.from('transfers').insert({ recipient: id, amount: Math.round(amount), note: cleanText(note, 60) || '🎁 Gift from Abuja Life' });
  return explain(error);
}

export async function removeAd(slot: number): Promise<string | null> {
  const c = getClient();
  if (!c) return 'You need internet';
  const { error } = await c.from('billboards').delete().eq('slot', slot);
  return explain(error);
}

export async function announce(body: string, news: string | null, days: number): Promise<string | null> {
  const c = getClient();
  const text = cleanText(body, 200);
  if (!c) return 'You need internet';
  if (!text) return 'Write something first';
  const { error } = await c.from('announcements').insert({ body: text, news, expires_at: new Date(Date.now() + days * 86400000).toISOString() });
  return explain(error);
}

export async function removeAnnouncement(id: number): Promise<string | null> {
  const c = getClient();
  if (!c) return 'You need internet';
  const { error } = await c.from('announcements').delete().eq('id', id);
  return explain(error);
}
