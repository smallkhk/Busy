import { create } from 'zustand';
import { cleanText } from './filter';
import { setPlayerId } from './multiplayer';
import { getClient } from './supabase';

export type Profile = { id: string; name: string; shirt: string };
export type Msg = { id: number; sender: string; recipient: string; body: string; created_at: string; read_at: string | null };

type SocialState = {
  /** needs-setup: anonymous sign-in or the tables are missing in Supabase. */
  status: 'off' | 'loading' | 'needs-setup' | 'ready';
  setupReason?: 'auth' | 'tables';
  uid: string | null;
  profiles: Record<string, Profile>;
  /** People I added (I can text them). */
  friends: string[];
  /** People who added me. */
  addedMe: string[];
  /** Messages by the other person's id, oldest first. */
  threads: Record<string, Msg[]>;
  /** Conversation open in GistApp. */
  openChat: string | null;
  /** Remote player whose name tag was tapped. */
  nearbyMenu: string | null;
};

export const useSocial = create<SocialState>(() => ({
  status: 'off',
  uid: null,
  profiles: {},
  friends: [],
  addedMe: [],
  threads: {},
  openChat: null,
  nearbyMenu: null,
}));

/** Short code to tell apart players with the same name. */
export const tag = (id: string) => `#${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;

const other = (m: Msg, uid: string) => (m.sender === uid ? m.recipient : m.sender);

function addMessages(msgs: Msg[]) {
  const { uid } = useSocial.getState();
  if (!uid || !msgs.length) return;
  useSocial.setState((s) => {
    const threads = { ...s.threads };
    for (const m of msgs) {
      const k = other(m, uid);
      const list = threads[k] ?? [];
      const i = list.findIndex((x) => x.id === m.id);
      threads[k] = i >= 0 ? list.map((x) => (x.id === m.id ? m : x)) : [...list, m].sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
    return { threads };
  });
}

async function loadProfiles(ids: string[]) {
  const c = getClient();
  const missing = ids.filter((id) => !useSocial.getState().profiles[id]);
  if (!c || !missing.length) return;
  const { data } = await c.from('profiles').select('id,name,shirt').in('id', missing);
  if (data) useSocial.setState((s) => ({ profiles: { ...s.profiles, ...Object.fromEntries(data.map((p) => [p.id, p as Profile])) } }));
}

let onIncoming: ((from: Profile | undefined, body: string) => void) | null = null;
/** Lets the game show a toast when a message lands. */
export const setIncomingHandler = (fn: typeof onIncoming) => (onIncoming = fn);

let started = false;

export async function initSocial(name: string, shirt: string) {
  const c = getClient();
  if (!c || started) return;
  started = true;
  useSocial.setState({ status: 'loading' });

  let { data: { session } } = await c.auth.getSession();
  if (!session) {
    const res = await c.auth.signInAnonymously();
    if (res.error || !res.data.session) {
      useSocial.setState({ status: 'needs-setup', setupReason: 'auth' });
      return;
    }
    session = res.data.session;
  }
  const uid = session.user.id;
  useSocial.setState({ uid });
  setPlayerId(uid);

  const { error } = await c.from('profiles').upsert({ id: uid, name: cleanText(name, 16) || 'Abuja Hustler', shirt, updated_at: new Date().toISOString() });
  if (error) {
    useSocial.setState({ status: 'needs-setup', setupReason: 'tables' });
    return;
  }

  const [{ data: fr }, { data: msgs }] = await Promise.all([
    c.from('friends').select('user_id,friend_id'),
    c.from('messages').select('*').order('created_at', { ascending: false }).limit(300),
  ]);
  const friends = (fr ?? []).filter((f) => f.user_id === uid).map((f) => f.friend_id as string);
  const addedMe = (fr ?? []).filter((f) => f.friend_id === uid).map((f) => f.user_id as string);
  useSocial.setState({ friends, addedMe, status: 'ready' });
  addMessages((msgs ?? []) as Msg[]);
  await loadProfiles([...friends, ...addedMe, ...((msgs ?? []) as Msg[]).map((m) => other(m, uid))]);

  c.channel(`dm:${uid}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient=eq.${uid}` }, async ({ new: m }) => {
      const msg = m as Msg;
      await loadProfiles([msg.sender]);
      addMessages([msg]);
      if (useSocial.getState().openChat !== msg.sender) onIncoming?.(useSocial.getState().profiles[msg.sender], msg.body);
      else void markRead(msg.sender);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender=eq.${uid}` }, ({ new: m }) => addMessages([m as Msg]))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friends', filter: `friend_id=eq.${uid}` }, async ({ new: f }) => {
      const id = (f as { user_id: string }).user_id;
      await loadProfiles([id]);
      useSocial.setState((s) => ({ addedMe: [...new Set([...s.addedMe, id])] }));
    })
    .subscribe();
}

export async function searchPlayers(q: string): Promise<Profile[]> {
  const c = getClient();
  const { uid } = useSocial.getState();
  const term = q.trim();
  if (!c || !uid || term.length < 2) return [];
  const { data } = await c.from('profiles').select('id,name,shirt').ilike('name', `%${term.replace(/[%_]/g, '')}%`).neq('id', uid).order('updated_at', { ascending: false }).limit(20);
  const found = (data ?? []) as Profile[];
  useSocial.setState((s) => ({ profiles: { ...s.profiles, ...Object.fromEntries(found.map((p) => [p.id, p])) } }));
  return found;
}

export async function addFriend(id: string): Promise<boolean> {
  const c = getClient();
  const { uid, friends } = useSocial.getState();
  if (!c || !uid || id === uid) return false;
  if (friends.includes(id)) return true;
  const { error } = await c.from('friends').insert({ user_id: uid, friend_id: id });
  if (error && error.code !== '23505') return false;
  useSocial.setState((s) => ({ friends: [...new Set([...s.friends, id])] }));
  await loadProfiles([id]);
  return true;
}

let lastSend = 0;
export async function sendMessage(to: string, raw: string): Promise<boolean> {
  const c = getClient();
  const body = cleanText(raw, 300);
  if (!c || !body || Date.now() - lastSend < 700) return false;
  lastSend = Date.now();
  const { data, error } = await c.from('messages').insert({ recipient: to, body }).select().single();
  if (error || !data) return false;
  addMessages([data as Msg]);
  return true;
}

export async function markRead(from: string) {
  const c = getClient();
  const { uid, threads } = useSocial.getState();
  if (!c || !uid || !threads[from]?.some((m) => m.sender === from && !m.read_at)) return;
  const now = new Date().toISOString();
  addMessages(threads[from].filter((m) => m.sender === from && !m.read_at).map((m) => ({ ...m, read_at: now })));
  await c.from('messages').update({ read_at: now }).eq('sender', from).eq('recipient', uid).is('read_at', null);
}

export const unreadFrom = (s: SocialState, id: string) => (s.threads[id] ?? []).filter((m) => m.sender === id && !m.read_at).length;
export const totalUnread = (s: SocialState) => Object.keys(s.threads).reduce((n, id) => n + unreadFrom(s, id), 0);
