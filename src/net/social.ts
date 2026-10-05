import { create } from 'zustand';
import { cleanText } from './filter';
import { setPlayerId } from './multiplayer';
import { getClient } from './supabase';
import { startPhoneLine } from './phoneLine';

export type Profile = { id: string; name: string; shirt: string };
export type Msg = { id: number; sender: string; recipient: string; body: string; created_at: string; read_at: string | null; voice_path?: string | null; voice_ms?: number | null };

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
  startPhoneLine(uid, cleanText(name, 16) || 'Abuja Hustler');
  void claimCash();
  void cleanupOldVoice(uid);
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
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transfers', filter: `recipient=eq.${uid}` }, () => void claimCash())
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

// ---------------- Voice notes ----------------
/** Your own voice notes get deleted after this, so storage no go fill up. */
const VOICE_KEEP_DAYS = 14;

export async function sendVoice(to: string, rec: { blob: Blob; ms: number; type: string; ext: string }): Promise<string | null> {
  const c = getClient();
  const { uid } = useSocial.getState();
  if (!c || !uid) return 'Messaging never ready';
  if (rec.ms < 700) return 'Too short. Hold am small longer';
  const path = `${uid}/${to}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${rec.ext}`;
  const up = await c.storage.from('voice').upload(path, rec.blob, { contentType: rec.type, upsert: false });
  if (up.error) return /bucket|not found/i.test(up.error.message) ? 'Voice notes never set up. Game owner: run supabase/voice.sql' : `Upload fail: ${up.error.message}`;
  const { data, error } = await c.from('messages').insert({ recipient: to, body: '🎤 Voice note', voice_path: path, voice_ms: Math.round(rec.ms) }).select().single();
  if (error || !data) {
    await c.storage.from('voice').remove([path]);
    return 'Message no send. Try again';
  }
  addMessages([data as Msg]);
  return null;
}

const voiceUrls = new Map<string, Promise<string | null>>();

/** Downloads a voice note once and keeps a local URL for playback. */
export function voiceUrl(path: string): Promise<string | null> {
  let p = voiceUrls.get(path);
  if (!p) {
    p = (async () => {
      const c = getClient();
      if (!c) return null;
      const { data, error } = await c.storage.from('voice').download(path);
      return error || !data ? null : URL.createObjectURL(data);
    })();
    voiceUrls.set(path, p);
    void p.then((u) => u || voiceUrls.delete(path));
  }
  return p;
}

/** Deletes voice notes you sent more than two weeks ago. */
async function cleanupOldVoice(uid: string) {
  const c = getClient();
  if (!c) return;
  const cutoff = Date.now() - VOICE_KEEP_DAYS * 24 * 60 * 60 * 1000;
  const { data: folders } = await c.storage.from('voice').list(uid, { limit: 100 });
  for (const f of folders ?? []) {
    const { data: files } = await c.storage.from('voice').list(`${uid}/${f.name}`, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } });
    const old = (files ?? []).filter((x) => x.created_at && Date.parse(x.created_at) < cutoff).map((x) => `${uid}/${f.name}/${x.name}`);
    if (old.length) await c.storage.from('voice').remove(old);
  }
}

// ---------------- Sending money ----------------
export type Transfer = { id: number; sender: string; recipient: string; amount: number; note: string | null; claimed: boolean };

let onCash: ((from: Profile | undefined, amount: number, note: string | null) => void) | null = null;
/** Lets the game add the money when a friend sends you some. */
export const setCashHandler = (fn: typeof onCash) => (onCash = fn);

/** Sends money to a friend. The caller takes it from your balance when this returns null. */
export async function sendCash(to: string, amount: number, note: string): Promise<string | null> {
  const c = getClient();
  const { uid, friends } = useSocial.getState();
  if (!c || !uid) return 'You need internet';
  if (!friends.includes(to)) return 'Add am as friend first';
  if (amount < 100 || amount > 500000) return 'Between ₦100 and ₦500,000 per transfer';
  const { error } = await c.from('transfers').insert({ recipient: to, amount: Math.round(amount), note: cleanText(note, 60) || null });
  if (error) return /relation|does not exist|schema cache/i.test(error.message) ? 'Transfers never set up. Game owner: run supabase/cloud.sql' : 'Transfer fail. Try again';
  return null;
}

/** Collects every transfer waiting for you (each one only once). */
export async function claimCash() {
  const c = getClient();
  const { uid } = useSocial.getState();
  if (!c || !uid) return;
  const { data } = await c.from('transfers').select('*').eq('recipient', uid).eq('claimed', false).limit(50);
  for (const t of (data ?? []) as Transfer[]) {
    const { data: done } = await c.from('transfers').update({ claimed: true }).eq('id', t.id).eq('claimed', false).select('id');
    if (!done?.length) continue;
    await loadProfiles([t.sender]);
    onCash?.(useSocial.getState().profiles[t.sender], t.amount, t.note);
  }
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
