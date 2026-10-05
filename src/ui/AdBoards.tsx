import { useEffect, useMemo, useState } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { AD_COLORS, AD_EMOJIS, BOARD_SLOTS, boardBySlot, MAX_AD_DAYS, type BoardSlot } from '../content/billboards';
import { formatNaira } from '../engine/clock';
import { isLive, rentAd, useBoards, type Ad } from '../net/billboards';
import { useSocial } from '../net/social';
import { useGame } from '../store/game';

/** Light text on dark boards, dark text on light ones. */
const ink = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? '#1b1a22' : '#ffffff';
};

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function adTexture(ad: Ad | undefined, big: boolean): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  const bg = ad?.color ?? '#2b2f36';
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = big ? '#3dd6ff' : 'rgba(255,255,255,0.35)';
  g.lineWidth = big ? 14 : 8;
  g.strokeRect(4, 4, 504, 248);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (ad) {
    g.fillStyle = ink(bg);
    g.font = '64px sans-serif';
    g.fillText(ad.emoji, 256, 62);
    g.font = 'bold 40px sans-serif';
    const lines = wrap(g, ad.body, 470);
    lines.forEach((l, i) => g.fillText(l, 256, 132 + i * 42 - (lines.length - 1) * 8));
    g.font = '22px sans-serif';
    g.globalAlpha = 0.75;
    g.fillText(`by ${ad.owner_name}`, 256, 234);
  } else {
    g.fillStyle = '#e8b04b';
    g.font = 'bold 46px sans-serif';
    g.fillText('📢 YOUR AD HERE', 256, 100);
    g.fillStyle = '#ffffff';
    g.font = '30px sans-serif';
    g.fillText('Tap to rent this board', 256, 168);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function Board({ b, ad, onTap }: { b: BoardSlot; ad?: Ad; onTap: (slot: number) => void }) {
  const live = isLive(ad) ? ad : undefined;
  const key = live ? `${live.body}|${live.emoji}|${live.color}|${live.owner_name}` : 'empty';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tex = useMemo(() => adTexture(live, b.big), [key, b.big]);
  useEffect(() => () => tex.dispose(), [tex]);
  const w = b.big ? 2.4 : 1.2;
  const h = w / 2;
  const pole = b.big ? 1.5 : 0.9;
  return (
    <group
      position={[b.x, 0, b.z]}
      rotation={[0, Math.PI / 4, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onTap(b.slot);
      }}
    >
      {(b.big ? [-w / 3, w / 3] : [0]).map((x) => (
        <mesh key={x} position={[x, pole / 2, -0.03]}>
          <boxGeometry args={[0.06, pole, 0.06]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      ))}
      <mesh position={[0, pole + h / 2, -0.04]}>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.05]} />
        <meshStandardMaterial color={b.big ? '#111' : '#3a3a3a'} />
      </mesh>
      <mesh position={[0, pole + h / 2, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Every rentable board on the 3D map. Ads come from Supabase so all players see them. */
export function AdBoards({ onTap }: { onTap: (slot: number) => void }) {
  const ads = useBoards((s) => s.ads);
  return (
    <>
      {BOARD_SLOTS.map((b) => (
        <Board key={b.slot} b={b} ad={ads[b.slot]} onTap={onTap} />
      ))}
    </>
  );
}

const fmtDate = (iso: string) => new Date(iso).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });

/** Sheet to see who get a board, or rent it. */
export function AdSheet({ slot, onClose }: { slot: number; onClose: () => void }) {
  const b = boardBySlot(slot)!;
  const status = useBoards((s) => s.status);
  const ad = useBoards((s) => s.ads[slot]);
  const uid = useSocial((s) => s.uid);
  const money = useGame((s) => s.money);
  const name = useGame((s) => s.name);
  const live = isLive(ad) ? ad : undefined;
  const mine = !!live && live.owner === uid;
  const daysLeft = live ? Math.ceil((Date.parse(live.expires_at) - Date.now()) / 86400000) : 0;
  const maxDays = Math.max(0, MAX_AD_DAYS - (mine ? daysLeft : 0));
  const [body, setBody] = useState(mine ? live!.body : '');
  const [emoji, setEmoji] = useState(mine ? live!.emoji : '📢');
  const [color, setColor] = useState(mine ? live!.color : AD_COLORS[0]);
  const [days, setDays] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const cost = b.pricePerDay * Math.min(days, maxDays);

  const rent = async () => {
    if (money < cost) return setErr(`You need ${formatNaira(cost)}`);
    setBusy(true);
    const e = await rentAd(slot, { body, emoji, color, days: Math.min(days, maxDays) }, name);
    setBusy(false);
    if (e) return setErr(e);
    const until = Date.parse(useBoards.getState().ads[slot]?.expires_at ?? '') || Date.now() + days * 86400000;
    useGame.getState().payForAd(cost, `Billboard: ${b.where}`, until);
    onClose();
  };

  return (
    <div className="ad-sheet">
      <div className="ad-head">
        <span>{b.big ? '🖥️ LED screen' : '🪧 Billboard'} · {b.where}</span>
        <button className="ghost" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {status === 'offline' && <p className="muted small">Billboards need internet and GistApp ready. Check your connection.</p>}
      {status === 'needs-setup' && <p className="muted small">Billboards never set up. Game owner: run supabase/billboards.sql</p>}
      {status === 'loading' && <p className="muted small">Loading ads…</p>}
      {status === 'ready' && live && !mine && (
        <div className="ad-preview" style={{ background: live.color }}>
          <span>{live.emoji} {live.body}</span>
          <small>Rented by {live.owner_name} till {fmtDate(live.expires_at)}</small>
        </div>
      )}
      {status === 'ready' && (!live || mine) && (
        <>
          {mine && <p className="small">✅ Na your ad dey here till {fmtDate(live!.expires_at)}. Change am or add days.</p>}
          <div className="ad-preview" style={{ background: color, color: ink(color) }}>
            <span>{emoji} {body || 'Your message here'}</span>
            <small>by {name}</small>
          </div>
          <input className="ad-input" value={body} maxLength={40} placeholder='e.g. "Mama Chidi Kitchen, Wuse 🍲"' onChange={(e) => setBody(e.target.value)} />
          <div className="ad-emojis">
            {AD_EMOJIS.map((e) => (
              <button key={e} className={emoji === e ? 'on' : ''} onClick={() => setEmoji(e)}>{e}</button>
            ))}
          </div>
          <div className="ad-colors">
            {AD_COLORS.map((c) => (
              <button key={c} className={color === c ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Colour ${c}`} />
            ))}
          </div>
          {maxDays > 0 ? (
            <label className="small ad-days">
              Days: <b>{Math.min(days, maxDays)}</b>
              <input type="range" min={1} max={maxDays} value={Math.min(days, maxDays)} onChange={(e) => setDays(Number(e.target.value))} />
            </label>
          ) : (
            <p className="muted small">E don reach the 7-day maximum. You fit still change the text.</p>
          )}
          {err && <p className="small" style={{ color: '#f5b7b1' }}>{err}</p>}
          <button className="primary" disabled={busy || !body.trim() || (maxDays === 0 && !mine) || money < cost} onClick={() => void rent()}>
            {busy ? 'Posting…' : `${mine ? (maxDays ? 'Update & extend' : 'Update text') : 'Rent board'} · ${formatNaira(cost)}`}
          </button>
          <p className="muted small">{formatNaira(b.pricePerDay)}/day · real days · everybody for Abuja go see am · business +10% while e dey</p>
        </>
      )}
    </div>
  );
}
