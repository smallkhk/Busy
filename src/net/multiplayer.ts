import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { multiplayerEnabled, SUPABASE_KEY, SUPABASE_URL } from './config';
import { cleanText } from './filter';
import { useNet, type ChatMsg, type Remote } from './useNet';

const ID_KEY = 'abuja-life-player-id';
const BUBBLE_MS = 6000;

let client: SupabaseClient | null = null;
let lobby: RealtimeChannel | null = null;
let room: RealtimeChannel | null = null;
let me: Remote = { id: '', name: '', shirt: '#2f9e6b', x: 0, z: 0 };
let lastChat = 0;

export function playerId(): string {
  try {
    const saved = localStorage.getItem(ID_KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
    return id;
  } catch {
    return me.id || (me.id = crypto.randomUUID());
  }
}

export function startMultiplayer(name: string, shirt: string) {
  if (!multiplayerEnabled() || client) return;
  me = { ...me, id: playerId(), name: cleanText(name, 16) || 'Abuja Hustler', shirt };
  client = createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 10 } } });
  lobby = client.channel('abuja-lobby', { config: { presence: { key: me.id } } });
  lobby
    .on('presence', { event: 'sync' }, () => useNet.setState({ online: Object.keys(lobby!.presenceState()).length }))
    .subscribe((status) => {
      useNet.setState({ connected: status === 'SUBSCRIBED' });
      if (status === 'SUBSCRIBED') void lobby!.track({ id: me.id });
    });
}

/** Players only meet in shared places; your house is private (room = null). */
export function joinRoom(key: string | null) {
  if (!client || useNet.getState().room === key) return;
  if (room) void client.removeChannel(room);
  room = null;
  useNet.setState({ room: key, players: {}, chat: [], bubbles: {} });
  if (!key) return;
  const ch = client.channel(`room:${key}`, { config: { presence: { key: me.id }, broadcast: { self: false } } });
  room = ch;
  ch.on('presence', { event: 'sync' }, () => {
    const state = ch.presenceState<Remote>();
    const players: Record<string, Remote> = {};
    for (const [id, metas] of Object.entries(state)) {
      if (id === me.id || !metas.length) continue;
      const m = metas[metas.length - 1];
      players[id] = { ...useNet.getState().players[id], ...m, id };
    }
    useNet.setState({ players });
  })
    .on('broadcast', { event: 'move' }, ({ payload }) => {
      const p = payload as Remote;
      const cur = useNet.getState().players[p.id];
      if (cur) useNet.setState((s) => ({ players: { ...s.players, [p.id]: { ...cur, x: p.x, z: p.z, hidden: p.hidden } } }));
    })
    .on('broadcast', { event: 'chat' }, ({ payload }) => addChat(payload as ChatMsg))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') void ch.track(me);
    });
}

function addChat(m: ChatMsg) {
  useNet.setState((s) => ({
    chat: [...s.chat, m].slice(-30),
    bubbles: { ...s.bubbles, [m.mine ? 'me' : m.id]: { text: m.text, until: Date.now() + BUBBLE_MS } },
  }));
}

let lastSent = { x: NaN, z: NaN, hidden: false };
/** Called a few times a second with your avatar position. */
export function sendMove(x: number, z: number, hidden: boolean) {
  me = { ...me, x, z, hidden };
  if (!room || (Math.abs(x - lastSent.x) < 0.05 && Math.abs(z - lastSent.z) < 0.05 && hidden === lastSent.hidden)) return;
  lastSent = { x, z, hidden };
  void room.send({ type: 'broadcast', event: 'move', payload: { id: me.id, x, z, hidden } });
}

/** Refresh presence so late joiners see where you stand. */
export function refreshPresence() {
  if (room) void room.track(me);
}

export function sendChat(raw: string): boolean {
  const text = cleanText(raw);
  if (!text || !room) return false;
  const now = Date.now();
  if (now - lastChat < 2000) return false;
  lastChat = now;
  const msg: ChatMsg = { id: me.id, name: me.name, text, at: now };
  void room.send({ type: 'broadcast', event: 'chat', payload: msg });
  addChat({ ...msg, mine: true });
  return true;
}
