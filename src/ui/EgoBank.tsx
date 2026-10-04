import { useState } from 'react';
import { CONTACTS } from '../content/contacts';
import { AMOUNT_CHIPS, LOAN_DAYS, LOAN_FEE, LOAN_MAX, SAVINGS_DAILY_RATE, TOKEN_COST } from '../content/phoneapps';
import { clockParts, formatClock, formatNaira } from '../engine/clock';
import { useGame } from '../store/game';

type View = 'home' | 'send' | 'bills' | 'save' | 'loan';

const ICONS: [RegExp, string][] = [
  [/ego save/i, '🐷'],
  [/rent|moved/i, '🏠'],
  [/transfer/i, '💸'],
  [/loan/i, '📲'],
  [/token|aedc|gen/i, '💡'],
  [/abujagram|brand/i, '📸'],
  [/gift/i, '🎁'],
  [/ride|bus|taxi|okada/i, '🚘'],
  [/jollof|indomie|rice|shawarma|foodstuff|suya|tea|tuwo|pizza|zobo|cocktail|bottle|food|chop|beans|ice cream|biscuit|water/i, '🍛'],
  [/shirt|shoe|perfume|okrika|aso-ebi/i, '👔'],
];

function txnIcon(label: string, amount: number) {
  for (const [re, icon] of ICONS) if (re.test(label)) return icon;
  return amount > 0 ? '💰' : '🧾';
}

/** Stable fake account number from the player's name. */
function accountNumber(name: string) {
  let h = 7;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 100000000;
  return `20${String(h).padStart(8, '0')}`;
}

function greeting(hour: number) {
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

function Chips({ onPick, max }: { onPick: (n: number) => void; max: number }) {
  return (
    <div className="ego-chips">
      {AMOUNT_CHIPS.map((n) => (
        <button key={n} disabled={n > max} onClick={() => onPick(n)}>{formatNaira(n)}</button>
      ))}
    </div>
  );
}

function Back({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="ego-subhead">
      <button onClick={onBack}>‹</button>
      <span>{title}</span>
    </div>
  );
}

export function EgoBank() {
  const [view, setView] = useState<View>('home');
  const [hidden, setHidden] = useState(false);
  const [to, setTo] = useState<string | null>(null);
  const name = useGame((s) => s.name);
  const money = useGame((s) => s.money);
  const savings = useGame((s) => s.savings);
  const interest = useGame((s) => s.savingsInterest);
  const loan = useGame((s) => s.loan);
  const txns = useGame((s) => s.txns);
  const contacts = useGame((s) => s.contacts);
  const time = useGame((s) => s.time);
  const openPhone = useGame((s) => s.openPhone);
  const { saveMoney, withdrawSavings, takeLoan, repayLoan, sendMoney, buyToken } = useGame.getState();
  const { hour, day } = clockParts(time);
  const show = (n: number) => (hidden ? '₦ ••••••' : formatNaira(n));

  if (view === 'send') {
    const people = [{ id: 'mama', name: 'Mama', emoji: '👩🏾‍🦳', role: 'Family' }, ...CONTACTS.filter((c) => contacts[c.id])];
    const target = people.find((p) => p.id === to);
    return (
      <div className="ego">
        <Back onBack={() => (to ? setTo(null) : setView('home'))} title={target ? `Send to ${target.name}` : 'Send money'} />
        {!target ? (
          <div className="ego-list">
            {people.map((p) => (
              <button key={p.id} className="ego-row" onClick={() => setTo(p.id)}>
                <span className="ego-icon">{p.emoji}</span>
                <span className="ego-row-body"><b>{p.name}</b><span>{p.role}</span></span>
                <span>›</span>
              </button>
            ))}
            {people.length === 1 && <p className="ego-note">Meet people for Abuja make dem show for here 🦵</p>}
          </div>
        ) : (
          <>
            <p className="ego-note">Balance: {formatNaira(money)}. {target.id === 'mama' ? 'Mama go pray for you 🙏' : 'E go make una closer 🦵'}</p>
            <Chips max={money} onPick={(n) => { sendMoney(target.id, n); setTo(null); setView('home'); }} />
          </>
        )}
      </div>
    );
  }

  if (view === 'bills') {
    return (
      <div className="ego">
        <Back onBack={() => setView('home')} title="Pay bills" />
        <div className="ego-list">
          <button className="ego-row" disabled={money < TOKEN_COST} onClick={() => { buyToken(); setView('home'); }}>
            <span className="ego-icon">💡</span>
            <span className="ego-row-body"><b>AEDC prepaid token</b><span>Light go stand for 24 hours · {formatNaira(TOKEN_COST)}</span></span>
            <span>›</span>
          </button>
          <button className="ego-row" onClick={() => openPhone('house')}>
            <span className="ego-icon">🏠</span>
            <span className="ego-row-body"><b>House rent</b><span>Open Rent app</span></span>
            <span>›</span>
          </button>
        </div>
      </div>
    );
  }

  if (view === 'save') {
    return (
      <div className="ego">
        <Back onBack={() => setView('home')} title="Ego Save 🐷" />
        <div className="ego-card">
          <span className="ego-label">Savings</span>
          <span className="ego-big">{show(savings)}</span>
          <span className="ego-label">+{(SAVINGS_DAILY_RATE * 100).toFixed(1)}% every day · You don earn {formatNaira(interest)}</span>
          <span className="ego-label">Money for Ego Save no dey pocket, so pickpocket no fit touch am 😉</span>
        </div>
        <p className="ego-note">Move money in</p>
        <Chips max={money} onPick={saveMoney} />
        <p className="ego-note">Withdraw</p>
        <Chips max={savings} onPick={withdrawSavings} />
        {savings > 0 && <button className="ego-primary" onClick={() => withdrawSavings(savings)}>Withdraw all</button>}
      </div>
    );
  }

  if (view === 'loan') {
    return (
      <div className="ego">
        <Back onBack={() => setView('home')} title="Ego Loan 📲" />
        {loan ? (
          <div className="ego-card">
            <span className="ego-label">You dey owe</span>
            <span className="ego-big">{formatNaira(loan.owed)}</span>
            <span className={`ego-label ${day > loan.dueDay ? 'ego-bad' : ''}`}>
              {day > loan.dueDay ? `⚠️ E don pass due date (Day ${loan.dueDay}). Dem go message your contacts!` : `Due Day ${loan.dueDay} (${loan.dueDay - day} days)`}
            </span>
            <button className="ego-primary" disabled={money < loan.owed} onClick={repayLoan}>Repay {formatNaira(loan.owed)}</button>
          </div>
        ) : (
          <>
            <div className="ego-card">
              <span className="ego-label">Borrow up to</span>
              <span className="ego-big">{formatNaira(LOAN_MAX)}</span>
              <span className="ego-label">{LOAN_FEE * 100}% interest · pay back in {LOAN_DAYS} days. If you no pay, we go tell your contacts 😬</span>
            </div>
            <Chips max={LOAN_MAX} onPick={(n) => { takeLoan(n); setView('home'); }} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="ego">
      <div className="ego-header">
        <div className="ego-hello">{greeting(hour)}, {name.split(' ')[0]} 👋🏾</div>
        <div className="ego-balance-row">
          <div>
            <div className="ego-label light">Total balance</div>
            <div className={`ego-balance ${money < 0 ? 'neg' : ''}`}>{show(money)}</div>
          </div>
          <button className="ego-eye" onClick={() => setHidden((h) => !h)} aria-label="Hide balance">{hidden ? '🙈' : '👁️'}</button>
        </div>
        <div className="ego-label light">Ego Bank · {accountNumber(name)}</div>
      </div>

      <div className="ego-actions">
        {([
          ['send', '💸', 'Send'],
          ['bills', '🧾', 'Bills'],
          ['save', '🐷', 'Save'],
          ['loan', '📲', 'Loan'],
        ] as const).map(([v, icon, label]) => (
          <button key={v} onClick={() => setView(v)}>
            <span className="ego-action-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="ego-minis">
        <button className="ego-mini" onClick={() => setView('save')}>
          <span>🐷 Ego Save</span>
          <b>{show(savings)}</b>
        </button>
        <button className="ego-mini" onClick={() => setView('loan')}>
          <span>📲 Loan</span>
          <b className={loan && day > loan.dueDay ? 'ego-bad' : ''}>{loan ? show(loan.owed) : 'None'}</b>
        </button>
      </div>

      <div className="ego-section">Transactions</div>
      <div className="ego-list">
        {txns.slice(0, 15).map((t, i) => (
          <div key={i} className="ego-row">
            <span className="ego-icon">{txnIcon(t.label, t.amount)}</span>
            <span className="ego-row-body">
              <b>{t.label}</b>
              <span>Day {clockParts(t.at).day}, {formatClock(t.at)}</span>
            </span>
            <span className={t.amount >= 0 ? 'ego-in' : 'ego-out'}>
              {hidden ? '••••' : `${t.amount >= 0 ? '+' : '-'}${formatNaira(Math.abs(t.amount))}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
