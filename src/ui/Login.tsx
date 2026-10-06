import { useEffect, useState } from 'react';
import { createLogin, logIn, logOut, refreshAccount, useAccount } from '../net/account';

/** Username + password fields with one action button. */
function Fields({ action, label, onDone }: { action: (u: string, p: string) => Promise<string | null>; label: string; onDone?: () => void }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const go = async () => {
    setBusy(true);
    setMsg(null);
    const e = await action(u, p);
    setBusy(false);
    if (e) setMsg(e);
    else onDone?.();
  };
  return (
    <div className="login-fields">
      <input className="ad-input" value={u} maxLength={17} autoCapitalize="none" autoCorrect="off" autoComplete="username" placeholder="username" onChange={(e) => setU(e.target.value)} />
      <input className="ad-input" value={p} type="password" autoComplete={label.includes('Create') ? 'new-password' : 'current-password'} placeholder="password (6+ characters)" onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void go()} />
      <button className="primary" disabled={busy || !u || !p} onClick={() => void go()}>
        {busy ? 'Wait small…' : label}
      </button>
      {msg && <p className="small login-error">{msg}</p>}
    </div>
  );
}

/** Start screen: log in to a life you already get. */
export function LoginCard({ onBack }: { onBack: () => void }) {
  return (
    <div className="start">
      <div className="start-card card">
        <div className="logo">ABUJA<span>LIFE</span></div>
        <p className="tagline">Welcome back 🙌🏾</p>
        <div className="story muted small">Login with your username and password. Your life go load from the cloud, the same one from your other phone.</div>
        <Fields action={logIn} label="🔐 Login" />
        <button className="ghost" onClick={onBack}>⬅️ New life instead</button>
      </div>
    </div>
  );
}

/** ⚙️ Account: protect a guest life with a login, or see who you be and log out. */
export function AccountLogin() {
  const { username, checked } = useAccount();
  const [saved, setSaved] = useState(false);
  const [switching, setSwitching] = useState(false);
  useEffect(() => void refreshAccount(), []);
  if (!checked) return null;
  if (username)
    return (
      <div className="balance">
        <div className="muted small">🔐 Your login</div>
        <div className="balance-amt" style={{ fontSize: 20 }}>@{username}</div>
        <div className="muted small">{saved ? '✅ Saved! ' : ''}Use am to open your life on any phone.</div>
        <button className="ghost" style={{ marginTop: 8, width: '100%' }} onClick={() => confirm('Log out? This phone go start new guest life (your life dey safe for cloud).') && void logOut()}>
          Log out
        </button>
      </div>
    );
  return (
    <div className="balance">
      <div className="muted small">🔐 Protect your life</div>
      <div className="small">You dey play as guest. Make username and password so you fit login from any phone and never lose this life.</div>
      <Fields action={createLogin} label="Create login" onDone={() => setSaved(true)} />
      <button className="link-btn small" onClick={() => setSwitching((v) => !v)}>
        {switching ? 'Close' : 'I get login already'}
      </button>
      {switching && (
        <>
          <p className="muted small">⚠️ This guest life go comot from this phone when you login to another account.</p>
          <Fields action={logIn} label="🔐 Login" />
        </>
      )}
    </div>
  );
}
