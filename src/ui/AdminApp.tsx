import { useEffect, useState } from 'react';
import { formatNaira } from '../engine/clock';
import { WORLD_NEWS } from '../content/world';
import {
  announce,
  banPlayer,
  fetchStats,
  findPlayers,
  giftPlayer,
  removeAd,
  removeAnnouncement,
  removeFromRankings,
  renamePlayer,
  unbanPlayer,
  useAdmin,
  type AdminPlayer,
  type AdminStats,
} from '../net/admin';
import { isLive, loadAds, useBoards } from '../net/billboards';
import { tag } from '../net/social';
import { useNet } from '../net/useNet';

const since = (iso: string) => {
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
  return s < 120 ? 'now' : s < 7200 ? `${Math.round(s / 60)} min ago` : s < 172800 ? `${Math.round(s / 3600)} hr ago` : `${Math.round(s / 86400)} days ago`;
};

function Dashboard() {
  const [stats, setStats] = useState<AdminStats | string | null>(null);
  const here = useNet((s) => Object.keys(s.players).length);
  useEffect(() => {
    void fetchStats().then(setStats);
  }, []);
  if (!stats) return <p className="muted small">Loading…</p>;
  if (typeof stats === 'string') return <p className="small">⚠️ {stats}</p>;
  const tiles: [string, string][] = [
    ['👥 Players', String(stats.players)],
    ['🟢 Active today', String(stats.active_today)],
    ['📅 Active this week', String(stats.active_week)],
    ['🐣 New today', String(stats.new_today)],
    ['💬 Messages today', String(stats.messages_today)],
    ['🪧 Ads running', String(stats.ads_running)],
    ['☁️ Cloud saves', String(stats.saves)],
    ['🚫 Banned', String(stats.banned)],
    ['💰 Richest player', formatNaira(stats.richest)],
    ['📍 Online for your room', String(here)],
  ];
  return (
    <>
      <div className="admin-tiles">
        {tiles.map(([k, v]) => (
          <div key={k} className="admin-tile">
            <span className="muted small">{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>
      <button className="ghost" onClick={() => { setStats(null); void fetchStats().then(setStats); }}>🔄 Refresh</button>
    </>
  );
}

function PlayerRow({ p, refresh }: { p: AdminPlayer; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('50000');
  const run = async (fn: () => Promise<string | null>, ok: string) => {
    const e = await fn();
    setMsg(e ? `⚠️ ${e}` : ok);
    if (!e) refresh();
  };
  return (
    <div className="admin-player">
      <button className="admin-player-head" onClick={() => setOpen((v) => !v)}>
        <span className="admin-dot" style={{ background: p.shirt }} />
        <span className="action-body">
          <span>{p.name} <span className="muted small">{tag(p.id)}</span>{p.banned && ' 🚫'}</span>
          <span className="muted small">Seen {since(p.last_seen)} · joined {since(p.joined)}{p.net_worth !== null ? ` · ${formatNaira(p.net_worth)}` : ''}{p.day ? ` · day ${p.day}` : ''}</span>
        </span>
      </button>
      {open && (
        <div className="admin-tools">
          <input className="admin-input" value={text} maxLength={120} placeholder="Reason / new name / gift note" onChange={(e) => setText(e.target.value)} />
          <div className="admin-row">
            {p.banned ? (
              <button className="ghost" onClick={() => void run(() => unbanPlayer(p.id), '✅ Unbanned')}>✅ Unban</button>
            ) : (
              <button className="ghost danger" onClick={() => void run(() => banPlayer(p.id, text), '🚫 Banned: no chat, ads, transfers or rankings')}>🚫 Ban</button>
            )}
            <button className="ghost" onClick={() => void run(() => renamePlayer(p.id, text), '✏️ Renamed')}>✏️ Rename</button>
            <button className="ghost" onClick={() => void run(() => removeFromRankings(p.id), '🏆 Removed from rankings')}>🏆 Remove rank</button>
          </div>
          <div className="admin-row">
            <input className="admin-input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} />
            <button className="ghost" onClick={() => void run(() => giftPlayer(p.id, Number(amount), text), `🎁 Sent ${formatNaira(Number(amount))}`)}>🎁 Gift</button>
          </div>
          <p className="muted small">ID: {p.id}</p>
          {msg && <p className="small">{msg}</p>}
        </div>
      )}
    </div>
  );
}

function Players() {
  const [q, setQ] = useState('');
  const [list, setList] = useState<AdminPlayer[] | string | null>(null);
  const search = () => void findPlayers(q).then(setList);
  useEffect(search, []);
  return (
    <>
      <div className="admin-row">
        <input className="admin-input" value={q} placeholder="Name or #TAG" onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
        <button className="ghost" onClick={search}>🔍</button>
      </div>
      {!list ? <p className="muted small">Loading…</p> : typeof list === 'string' ? <p className="small">⚠️ {list}</p> : list.length === 0 ? <p className="muted small">Nobody match.</p> : list.map((p) => <PlayerRow key={p.id} p={p} refresh={search} />)}
    </>
  );
}

function Announce() {
  const announcements = useAdmin((s) => s.announcements);
  const [body, setBody] = useState('');
  const [news, setNews] = useState('');
  const [days, setDays] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <>
      <textarea className="admin-input" rows={3} maxLength={200} value={body} placeholder="Message for every player, e.g. Weekend bonus: Mai Shayi tea na free 😄" onChange={(e) => setBody(e.target.value)} />
      <label className="small">World event for everybody (optional)</label>
      <select className="admin-input" value={news} onChange={(e) => setNews(e.target.value)}>
        <option value="">None, just message</option>
        {WORLD_NEWS.map((n) => <option key={n.id} value={n.id}>{n.headline}</option>)}
      </select>
      <div className="love-tabs">
        {[1, 3, 7].map((d) => <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{d} day{d > 1 ? 's' : ''}</button>)}
      </div>
      <button className="primary" onClick={async () => {
        const e = await announce(body, news || null, days);
        setMsg(e ? `⚠️ ${e}` : '📣 Sent to every player');
        if (!e) setBody('');
      }}>📣 Announce</button>
      {msg && <p className="small">{msg}</p>}
      <p className="muted small">Running now:</p>
      {announcements.length === 0 && <p className="muted small">No announcement.</p>}
      {announcements.map((a) => (
        <div key={a.id} className="admin-player">
          <div className="admin-row">
            <span className="small" style={{ flex: 1 }}>{a.body}{a.news ? ` · 📰 ${a.news}` : ''}</span>
            <button className="ghost danger" onClick={() => void removeAnnouncement(a.id)}>🗑️</button>
          </div>
        </div>
      ))}
    </>
  );
}

function Ads() {
  const ads = useBoards((s) => s.ads);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => void loadAds(), []);
  const live = Object.values(ads).filter((a) => isLive(a));
  return (
    <>
      {msg && <p className="small">{msg}</p>}
      {live.length === 0 && <p className="muted small">No billboard running.</p>}
      {live.map((a) => (
        <div key={a.slot} className="admin-player">
          <div className="admin-row">
            <span className="admin-dot" style={{ background: a.color }} />
            <span className="small" style={{ flex: 1 }}>{a.emoji} {a.body}<br /><span className="muted">by {a.owner_name} · board {a.slot}</span></span>
            <button className="ghost danger" onClick={async () => {
              const e = await removeAd(a.slot);
              setMsg(e ? `⚠️ ${e}` : '🗑️ Ad removed');
              void loadAds();
            }}>🗑️</button>
          </div>
        </div>
      ))}
    </>
  );
}

/** 🛡️ Game owner panel. Only shows for players listed in public.admins. */
export function AdminApp() {
  const isAdmin = useAdmin((s) => s.isAdmin);
  const [tab, setTab] = useState<'stats' | 'players' | 'announce' | 'ads'>('stats');
  if (!isAdmin) return <p className="small">🔒 Na only the game owner fit open this.</p>;
  return (
    <>
      <div className="love-tabs">
        <button className={tab === 'stats' ? 'on' : ''} onClick={() => setTab('stats')}>📊</button>
        <button className={tab === 'players' ? 'on' : ''} onClick={() => setTab('players')}>👥</button>
        <button className={tab === 'announce' ? 'on' : ''} onClick={() => setTab('announce')}>📣</button>
        <button className={tab === 'ads' ? 'on' : ''} onClick={() => setTab('ads')}>🪧</button>
      </div>
      <div className="admin-col">
        {tab === 'stats' && <Dashboard />}
        {tab === 'players' && <Players />}
        {tab === 'announce' && <Announce />}
        {tab === 'ads' && <Ads />}
      </div>
    </>
  );
}
