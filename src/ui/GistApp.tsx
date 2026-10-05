import { useEffect, useRef, useState } from 'react';
import { useNet } from '../net/useNet';
import { useGame } from '../store/game';
import { addFriend, markRead, searchPlayers, sendMessage, tag, unreadFrom, useSocial, type Msg, type Profile } from '../net/social';

function Avatar({ p, size = 42 }: { p?: Profile; size?: number }) {
  return (
    <span className="gist-avatar" style={{ width: size, height: size, background: p?.shirt ?? '#888', fontSize: size * 0.42 }}>
      {(p?.name ?? '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

const NONE: Msg[] = [];
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function Setup() {
  const reason = useSocial((s) => s.setupReason);
  return (
    <div className="gist-empty">
      <div style={{ fontSize: 40 }}>🛠️</div>
      <p><b>GistApp never ready</b></p>
      <p className="small">
        {reason === 'auth'
          ? 'Game owner: turn on "Allow anonymous sign-ins" for Supabase (Authentication → Sign In / Providers).'
          : 'Game owner: run supabase/messaging.sql for Supabase SQL Editor.'}
      </p>
    </div>
  );
}

function Conversation({ id }: { id: string }) {
  const uid = useSocial((s) => s.uid);
  const p = useSocial((s) => s.profiles[id]);
  const thread = useSocial((s) => s.threads[id]);
  const msgs = thread ?? NONE;
  const isFriend = useSocial((s) => s.friends.includes(id));
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void markRead(id);
    end.current?.scrollIntoView({ block: 'end' });
  }, [id, msgs.length]);
  const send = async () => {
    if (await sendMessage(id, text)) setText('');
  };
  return (
    <div className="gist-convo">
      <div className="gist-convo-head">
        <button onClick={() => useSocial.setState({ openChat: null })} aria-label="Back">‹</button>
        <Avatar p={p} size={34} />
        <span className="gist-convo-name">{p?.name ?? 'Player'} <span className="gist-tag">{tag(id)}</span></span>
      </div>
      <div className="gist-wall">
        {msgs.length === 0 && <div className="gist-hint">Say hi to {p?.name ?? 'your friend'} 👋🏾</div>}
        {msgs.map((m: Msg) => {
          const mine = m.sender === uid;
          return (
            <div key={m.id} className={`gist-bubble ${mine ? 'mine' : ''}`}>
              {m.body}
              <span className="gist-meta">{time(m.created_at)}{mine && <span className={m.read_at ? 'read' : ''}> ✓✓</span>}</span>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {isFriend ? (
        <div className="gist-input">
          <input value={text} maxLength={300} placeholder="Message" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void send()} />
          <button onClick={() => void send()} aria-label="Send">➤</button>
        </div>
      ) : (
        <button className="gist-addback" onClick={() => void addFriend(id)}>➕ Add {p?.name ?? 'them'} as friend to reply</button>
      )}
    </div>
  );
}

function AddPanel({ onDone }: { onDone: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(false);
  const friends = useSocial((s) => s.friends);
  useEffect(() => {
    const t = setTimeout(async () => {
      setBusy(true);
      setResults(await searchPlayers(q));
      setBusy(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="gist-add">
      <input autoFocus value={q} placeholder="Search player name…" onChange={(e) => setQ(e.target.value)} />
      {busy && <div className="gist-hint">Searching…</div>}
      {!busy && q.trim().length >= 2 && results.length === 0 && <div className="gist-hint">Nobody with that name 🤷🏾</div>}
      {results.map((p) => (
        <div key={p.id} className="gist-row">
          <Avatar p={p} />
          <span className="gist-row-body"><b>{p.name}</b><span>{tag(p.id)}</span></span>
          {friends.includes(p.id) ? (
            <button className="gist-small" onClick={() => { useSocial.setState({ openChat: p.id }); onDone(); }}>Message</button>
          ) : (
            <button className="gist-small add" onClick={() => void addFriend(p.id)}>➕ Add</button>
          )}
        </div>
      ))}
    </div>
  );
}

export function GistApp() {
  const status = useSocial((s) => s.status);
  const openChat = useSocial((s) => s.openChat);
  const uid = useSocial((s) => s.uid);
  const profiles = useSocial((s) => s.profiles);
  const friends = useSocial((s) => s.friends);
  const addedMe = useSocial((s) => s.addedMe);
  const threads = useSocial((s) => s.threads);
  const state = useSocial();
  const players = useNet((s) => s.players);
  const nearby = Object.values(players);
  const [adding, setAdding] = useState(false);

  if (status === 'off') return <div className="gist-empty">Messaging dey off for this version.</div>;
  if (status === 'loading') return <div className="gist-empty">Loading your chats…</div>;
  if (status === 'needs-setup') return <Setup />;
  if (openChat) return <Conversation id={openChat} />;

  const ids = [...new Set([...friends, ...addedMe, ...Object.keys(threads)])].filter((id) => id !== uid);
  const last = (id: string) => threads[id]?.[threads[id].length - 1];
  ids.sort((a, b) => (last(b)?.created_at ?? '').localeCompare(last(a)?.created_at ?? ''));
  const strangersNearby = nearby.filter((p) => !friends.includes(p.id));

  return (
    <div className="gist">
      <div className="gist-head">
        <span>GistApp</span>
        <button onClick={() => setAdding((a) => !a)} aria-label="Add friend">{adding ? '✕' : '➕'}</button>
      </div>
      {adding && <AddPanel onDone={() => setAdding(false)} />}

      {strangersNearby.length > 0 && (
        <>
          <div className="gist-section">👋🏾 Near you</div>
          {strangersNearby.map((p) => (
            <div key={p.id} className="gist-row">
              <Avatar p={{ id: p.id, name: p.name, shirt: p.shirt }} />
              <span className="gist-row-body"><b>{p.name}</b><span>Dey for this place with you</span></span>
              <button className="gist-small add" onClick={() => void addFriend(p.id)}>➕ Add</button>
            </div>
          ))}
        </>
      )}

      <div className="gist-section">Chats</div>
      {ids.length === 0 && <div className="gist-hint">No chats yet. Tap ➕ to find friends by name, or tap somebody name tag for street 👋🏾</div>}
      {ids.map((id) => {
        const p = profiles[id];
        const m = last(id);
        const unread = unreadFrom(state, id);
        return (
          <button key={id} className="gist-row" onClick={() => useSocial.setState({ openChat: id })}>
            <Avatar p={p} />
            <span className="gist-row-body">
              <b>{p?.name ?? 'Player'}{!friends.includes(id) && <span className="gist-tag"> · wan be your friend</span>}</b>
              <span>{m ? `${m.sender === uid ? 'You: ' : ''}${m.body}` : 'Tap to start gist'}</span>
            </span>
            <span className="gist-row-side">
              {m && <span className={unread ? 'unread-time' : ''}>{time(m.created_at)}</span>}
              {unread > 0 && <span className="gist-badge">{unread}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Popover when you tap another player's name tag. */
export function NearbyMenu() {
  const id = useSocial((s) => s.nearbyMenu);
  const status = useSocial((s) => s.status);
  const isFriend = useSocial((s) => (id ? s.friends.includes(id) : false));
  const p = useNet((s) => (id ? s.players[id] : undefined));
  const [done, setDone] = useState(false);
  if (!id || !p) return null;
  const close = () => {
    setDone(false);
    useSocial.setState({ nearbyMenu: null });
  };
  return (
    <div className="sheet-backdrop" onPointerDown={close}>
      <div className="sheet card" onPointerDown={(e) => e.stopPropagation()}>
        <div className="sheet-title"><Avatar p={{ id, name: p.name, shirt: p.shirt }} size={30} /> {p.name}</div>
        {status !== 'ready' ? (
          <p className="muted small">Messaging never ready.</p>
        ) : (
          <>
            {!isFriend && !done && (
              <button className="action" onClick={async () => setDone(await addFriend(id))}>
                <span className="action-emoji">➕</span><span className="action-body"><span>Add friend</span></span>
              </button>
            )}
            {(isFriend || done) && <p className="small">✅ {p.name} na your friend</p>}
            <button className="action" disabled={!isFriend && !done} onClick={() => { useSocial.setState({ nearbyMenu: null, openChat: id }); useGame.getState().openPhone('gist'); }}>
              <span className="action-emoji">💬</span><span className="action-body"><span>Send message</span></span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
