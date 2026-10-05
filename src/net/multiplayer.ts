import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { multiplayerEnabled, SUPABASE_KEY, SUPABASE_URL } from './config';
import { cleanText } from './filter';
import { useNet, type ChatMsg, type Remote } from './useNet';

/**
 * One shared realtime channel for everybody. Presence carries who is online,
 * which room they are in and where they stand; broadcasts carry moves and chat.
 * Each client only shows players and messages from its own room.
 */
const ID_KEY = 'abuja-life-player-id';
const BUBBLE_MS = 6000;

type Presence = Remote & { room: string | null };

let client: SupabaseClient | null = null;
let channel: RealtimeChannel | null = null;
let subscribed = false;
let me: Presence = { id: '', name: '', shirt: '#2f9e6b', x: 0, z: 0, room: null };
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

/** Rebuild the list of players in my room from presence. */
function syncPlayers() {
  if (!channel) return;
  const state = channel.presenceState<Presence>();
  const players: Record<string, Remote> = {};
  const room = useNet.getState().room;
  for (const [id, metas] of Object.entries(state)) {
    const m = metas[metas.length - 1];
    if (!m || id === me.id || !room || m.room !== room) continue;
    const prev = useNet.getState().players[id];
    // Keep the live position from broadcasts if we already have one
    players[id] = { id, name: m.name, shirt: m.shirt, x: prev?.x ?? m.x, z: prev?.z ?? m.z, hidden: prev?.hidden ?? m.hidden };
  }
  useNet.setState({ online: Object.keys(state).length, players });
}

/** Show "reconnecting" only if the link stays down this long (phones blink a lot). */
const LOST_GRACE_MS = 4000;
/** Rebuild the channel if it stays down this long. */
const REBUILD_AFTER_MS = 8000;
let lostAt = 0;
let lostTimer: ReturnType<typeof setTimeout> | 0 = 0;

function setStatus(ok: boolean) {
  subscribed = ok;
  if (ok) {
    if (lostTimer) clearTimeout(lostTimer);
    lostTimer = 0;
    lostAt = 0;
    useNet.setState({ connected: true, everConnected: true });
    return;
  }
  if (!lostAt) lostAt = Date.now();
  if (!lostTimer) lostTimer = setTimeout(() => useNet.setState({ connected: false }), LOST_GRACE_MS);
}

function makeChannel() {
  if (!client) return;
  const ch = client.channel('abuja-lobby', { config: { presence: { key: me.id }, broadcast: { self: false } } });
  channel = ch;
  ch.on('presence', { event: 'sync' }, syncPlayers)
    .on('broadcast', { event: 'move' }, ({ payload }) => {
      const p = payload as Presence;
      if (p.room !== useNet.getState().room) return;
      const cur = useNet.getState().players[p.id];
      if (cur) useNet.setState((s) => ({ players: { ...s.players, [p.id]: { ...cur, x: p.x, z: p.z, hidden: p.hidden } } }));
    })
    .on('broadcast', { event: 'chat' }, ({ payload }) => {
      const m = payload as ChatMsg & { room: string };
      if (m.room === useNet.getState().room) addChat(m);
    })
    .subscribe((status) => {
      if (ch !== channel) return; // an old channel we already replaced
      setStatus(status === 'SUBSCRIBED');
      if (status === 'SUBSCRIBED') void ch.track(me);
    });
}

/** Throw away a stuck channel and join again. */
function rebuild() {
  if (!client) return;
  const old = channel;
  channel = null;
  if (old) void client.removeChannel(old);
  if (!client.realtime.isConnected()) client.realtime.connect();
  makeChannel();
}

export function startMultiplayer(name: string, shirt: string) {
  if (!multiplayerEnabled() || client) return;
  me = { ...me, id: playerId(), name: cleanText(name, 16) || 'Abuja Hustler', shirt };
  client = createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 10 }, heartbeatIntervalMs: 15000 } });
  makeChannel();
  // Watchdog: phones drop sockets when the screen sleeps; don't wait for slow backoff.
  setInterval(() => {
    if (!subscribed && lostAt && Date.now() - lostAt > REBUILD_AFTER_MS) {
      lostAt = Date.now();
      rebuild();
    }
  }, 3000);
  if (typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !client) return;
    if (!client.realtime.isConnected() || !subscribed) {
      lostAt = lostAt || Date.now();
      rebuild();
    } else {
      void channel?.track(me);
    }
  });
}

/** Players only meet in shared places; your house is private (room = null). */
export function joinRoom(key: string | null) {
  if (useNet.getState().room === key && me.room === key) return;
  me = { ...me, room: key };
  useNet.setState({ room: key, players: {}, chat: [], bubbles: {} });
  if (channel && subscribed) void channel.track(me);
  syncPlayers();
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
  if (!channel || !subscribed || !me.room) return;
  if (Math.abs(x - lastSent.x) < 0.05 && Math.abs(z - lastSent.z) < 0.05 && hidden === lastSent.hidden) return;
  lastSent = { x, z, hidden };
  void channel.send({ type: 'broadcast', event: 'move', payload: { id: me.id, room: me.room, x, z, hidden } });
}

/** Refresh presence so late joiners see where you stand. */
export function refreshPresence() {
  if (channel && subscribed) void channel.track(me);
}

export function sendChat(raw: string): boolean {
  const text = cleanText(raw);
  if (!text || !channel || !me.room) return false;
  const now = Date.now();
  if (now - lastChat < 2000) return false;
  lastChat = now;
  const msg: ChatMsg = { id: me.id, name: me.name, text, at: now };
  void channel.send({ type: 'broadcast', event: 'chat', payload: { ...msg, room: me.room } });
  addChat({ ...msg, mine: true });
  return true;
}
