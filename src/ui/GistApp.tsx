import { useEffect, useRef, useState } from 'react';
import { useNet } from '../net/useNet';
import { useGame } from '../store/game';
import { addFriend, sendCash, markRead, searchPlayers, sendMessage, sendVoice, tag, unreadFrom, useSocial, voiceUrl, type Msg, type Profile } from '../net/social';
import { canRecord, formatMs, MAX_VOICE_MS, startRecording, type Recorder } from '../net/voice';
import { canPlaceCalls, phoneLine } from '../net/phoneLine';
import { AIRTIME_PER_MIN, CALL_MIN_BALANCE } from '../net/calls';

function Avatar({ p, size = 42 }: { p?: Profile; size?: number }) {
  return (
    <span className="gist-avatar" style={{ width: size, height: size, background: p?.shirt ?? '#888', fontSize: size * 0.42 }}>
      {(p?.name ?? '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

const NONE: Msg[] = [];
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** Bars that look like a waveform, fixed per message so they no jump. */
const bars = (seed: number) => Array.from({ length: 22 }, (_, i) => 25 + ((seed * 9301 + i * 49297) % 233280) / 233280 * 75);

function VoiceBubble({ m }: { m: Msg }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'gone'>('idle');
  const [progress, setProgress] = useState(0);
  useEffect(() => () => audio.current?.pause(), []);
  const toggle = async () => {
    if (state === 'playing') {
      audio.current?.pause();
      return setState('idle');
    }
    if (!audio.current) {
      setState('loading');
      const url = await voiceUrl(m.voice_path!);
      if (!url) return setState('gone');
      const a = new Audio(url);
      a.ontimeupdate = () => setProgress(a.duration && isFinite(a.duration) ? a.currentTime / a.duration : a.currentTime * 1000 / (m.voice_ms || 1));
      a.onended = () => {
        setState('idle');
        setProgress(0);
      };
      audio.current = a;
    }
    try {
      await audio.current.play();
      setState('playing');
    } catch {
      setState('gone');
    }
  };
  const b = bars(m.id);
  return (
    <span className="gist-voice">
      <button className="gist-play" onClick={() => void toggle()} disabled={state === 'gone'} aria-label={state === 'playing' ? 'Pause' : 'Play voice note'}>
        {state === 'playing' ? '⏸' : state === 'loading' ? '…' : '▶'}
      </button>
      {state === 'gone' ? (
        <span className="small muted">Voice note don expire</span>
      ) : (
        <span className="gist-wave">
          {b.map((h, i) => (
            <i key={i} style={{ height: `${h}%`, opacity: i / b.length <= progress ? 1 : 0.45 }} />
          ))}
        </span>
      )}
      <span className="gist-dur">{formatMs(m.voice_ms ?? 0)}</span>
    </span>
  );
}

function RecordBar({ to, onDone }: { to: string; onDone: () => void }) {
  const rec = useRef<Recorder | null>(null);
  const [ms, setMs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const send = async () => {
    const r = rec.current;
    if (!r || sending) return;
    setSending(true);
    const out = await r.stop();
    rec.current = null;
    const e = out ? await sendVoice(to, out) : 'Nothing record';
    setSending(false);
    if (e) setErr(e);
    else onDone();
  };
  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    let alive = true;
    startRecording(() => void sendRef.current())
      .then((r) => {
        if (!alive) return r.cancel();
        rec.current = r;
      })
      .catch(() => setErr('Allow microphone for your browser to record'));
    const t = setInterval(() => rec.current && setMs(Date.now() - rec.current.startedAt), 200);
    return () => {
      alive = false;
      clearInterval(t);
      rec.current?.cancel();
    };
  }, []);
  if (err) {
    return (
      <div className="gist-input">
        <span className="gist-rec-err small">{err}</span>
        <button onClick={onDone} aria-label="Close">✕</button>
      </div>
    );
  }
  return (
    <div className="gist-input recording">
      <button className="gist-cancel" onClick={onDone} aria-label="Cancel">🗑️</button>
      <span className="gist-rec"><i className="gist-dot" /> {formatMs(ms)} <span className="muted small">/ {formatMs(MAX_VOICE_MS)}</span></span>
      <button onClick={() => void send()} disabled={sending} aria-label="Send voice note">{sending ? '…' : '➤'}</button>
    </div>
  );
}

const CASH_CHIPS = [1000, 5000, 20000, 50000];

/** Send naira from your Ego Bank to a friend (in-game money). */
function PayPanel({ to, name, onDone }: { to: string; name: string; onDone: () => void }) {
  const money = useGame((s) => s.money);
  const [amount, setAmount] = useState(5000);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const send = async () => {
    if (amount > useGame.getState().money) return setErr('You no get reach that one 😅');
    // Take the money first so the balance can't go negative while we wait
    useGame.getState().adjustMoney(-amount, `Transfer to ${name}`);
    setBusy(true);
    const e = await sendCash(to, amount, note);
    setBusy(false);
    if (e) {
      useGame.getState().adjustMoney(amount, `Transfer refund (${name})`);
      return setErr(e);
    }
    useGame.getState().toast(`💸 You don send ${name} ₦${amount.toLocaleString('en-NG')}`);
    void sendMessage(to, `💸 I don send you ₦${amount.toLocaleString('en-NG')}${note.trim() ? `: ${note.trim()}` : ''}`);
    onDone();
  };
  return (
    <div className="gist-pay">
      <div className="small">Send money to <b>{name}</b> (Ego Bank · you get ₦{money.toLocaleString('en-NG')})</div>
      <div className="gist-pay-chips">
        {CASH_CHIPS.map((c) => (
          <button key={c} className={amount === c ? 'on' : ''} onClick={() => setAmount(c)}>₦{c.toLocaleString('en-NG')}</button>
        ))}
      </div>
      <input value={note} maxLength={60} placeholder="Note (e.g. for transport 🚕)" onChange={(e) => setNote(e.target.value)} />
      {err && <div className="small" style={{ color: '#f5b7b1' }}>{err}</div>}
      <button className="primary" disabled={busy || amount > money} onClick={() => void send()}>{busy ? 'Sending…' : `Send ₦${amount.toLocaleString('en-NG')}`}</button>
    </div>
  );
}

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

/** Dial a friend; if you no get money, tell you why. */
async function callPlayer(id: string, name: string) {
  const why = await phoneLine.call(id, name);
  if (why) useGame.getState().toast(`📞 ${why}`);
}

function Conversation({ id }: { id: string }) {
  const uid = useSocial((s) => s.uid);
  const p = useSocial((s) => s.profiles[id]);
  const thread = useSocial((s) => s.threads[id]);
  const msgs = thread ?? NONE;
  const isFriend = useSocial((s) => s.friends.includes(id));
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [paying, setPaying] = useState(false);
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
        {isFriend && <button className="gist-cash-btn" onClick={() => setPaying((v) => !v)} aria-label="Send money">💸</button>}
        {isFriend && canPlaceCalls() && <button className="gist-cash-btn" onClick={() => void callPlayer(id, p?.name ?? 'Player')} aria-label="Call">📞</button>}
      </div>
      {paying && <PayPanel to={id} name={p?.name ?? 'your friend'} onDone={() => setPaying(false)} />}
      <div className="gist-wall">
        {msgs.length === 0 && <div className="gist-hint">Say hi to {p?.name ?? 'your friend'} 👋🏾</div>}
        {msgs.map((m: Msg) => {
          const mine = m.sender === uid;
          return (
            <div key={m.id} className={`gist-bubble ${mine ? 'mine' : ''}`}>
              {m.voice_path ? <VoiceBubble m={m} /> : m.body}
              <span className="gist-meta">{time(m.created_at)}{mine && <span className={m.read_at ? 'read' : ''}> ✓✓</span>}</span>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {isFriend && recording ? (
        <RecordBar to={id} onDone={() => setRecording(false)} />
      ) : isFriend ? (
        <div className="gist-input">
          <input value={text} maxLength={300} placeholder="Message" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void send()} />
          {text.trim() || !canRecord() ? (
            <button onClick={() => void send()} aria-label="Send">➤</button>
          ) : (
            <button onClick={() => setRecording(true)} aria-label="Record voice note">🎤</button>
          )}
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
            {canPlaceCalls() && (
              <button className="action" disabled={!isFriend && !done} onClick={() => { close(); void callPlayer(id, p.name); }}>
                <span className="action-emoji">📞</span>
                <span className="action-body"><span>Call {p.name}</span><span className="muted small">Need ₦{CALL_MIN_BALANCE.toLocaleString('en-NG')}+ for account · ₦{AIRTIME_PER_MIN}/min</span></span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
