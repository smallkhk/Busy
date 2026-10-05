import { heatLevel } from '../engine/events';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { isMuted, setMuted } from '../audio/sound';
import { activityById, INTERACTABLES, PLACE_NAMES } from '../content/activities';
import { SICKNESS } from '../content/health';
import { placeLabel } from '../content/housing';
import { clockParts, formatClock, formatNaira } from '../engine/clock';
import { mood, moodFace, NEED_KEYS, NEED_META } from '../engine/needs';
import { blockReason, useGame } from '../store/game';
import { activityDetail } from './detail';

export function TopBar() {
  const time = useGame((s) => Math.floor(s.time));
  const money = useGame((s) => s.money);
  const power = useGame((s) => s.power);
  const needs = useGame((s) => s.needs);
  const place = useGame((s) => s.place);
  const packaging = useGame((s) => s.packaging);
  const area = useGame((s) => s.area);
  const sick = useGame((s) => s.sick);
  const heat = useGame((s) => s.heat ?? 0);
  const [soundOff, setSoundOff] = useState(isMuted());
  const { day } = clockParts(time);
  return (
    <div className="topbar">
      <div className="pill">
        <span className="big">{formatClock(time)}</span>
        <span className="muted">Day {day} · {placeLabel(place, area, PLACE_NAMES)}</span>
      </div>
      <div className="pill pair" title={power ? 'Light dey' : 'No light'}>
        <span>{power ? '💡' : '🕯️'}</span>
        <span title={sick ? SICKNESS[sick].name : 'Mood'}>{sick ? '🤒' : moodFace(mood(needs))}</span>
        {heat >= 20 && <span title={`Police: ${heatLevel(heat).name} (${Math.round(heat)})`}>{heatLevel(heat).emoji}</span>}
      </div>
      <button className="pill small-pill" onClick={() => { const m = !soundOff; setMuted(m); setSoundOff(m); }} aria-label={soundOff ? 'Turn sound on' : 'Turn sound off'}>
        {soundOff ? '🔇' : '🔊'}
      </button>
      <div className="pill small-pill" title="Packaging: how rich you look">👔{Math.round(packaging)}</div>
      <div className={`pill money ${money < 0 ? "debt" : ""}`} title={money < 0 ? "You dey owe" : "Your money"}>{formatNaira(money)}</div>
    </div>
  );
}

export function NeedsPanel() {
  const needs = useGame((s) => s.needs);
  return (
    <div className="needs card">
      {NEED_KEYS.map((k) => {
        const v = needs[k];
        const tone = v < 20 ? 'bad' : v < 45 ? 'mid' : 'good';
        return (
          <div key={k} className="need" title={`${NEED_META[k].label}: ${Math.round(v)}`}>
            <span className="need-emoji">{NEED_META[k].emoji}</span>
            <div className="bar">
              <div className={`fill ${tone}`} style={{ width: `${v}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ActiveBanner() {
  const active = useGame((s) => s.active);
  const cancel = useGame((s) => s.cancel);
  if (!active) return null;
  const a = activityById(active.id);
  if (!a) return null;
  const pct = 100 - (active.remaining / (active.total ?? a.minutes)) * 100;
  const mins = Math.ceil(active.remaining);
  return (
    <div className="banner card">
      <span className="banner-emoji">{a.emoji}</span>
      <div className="banner-body">
        <div className="banner-title">{a.doing}…</div>
        <div className="bar thin">
          <div className="fill good" style={{ width: `${pct}%` }} />
        </div>
        <div className="muted small">{mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`} remain</div>
      </div>
      <button className="ghost" onClick={cancel}>Stop</button>
    </div>
  );
}

export function ActionMenu() {
  const menu = useGame((s) => s.menu);
  const openMenu = useGame((s) => s.openMenu);
  const choose = useGame((s) => s.choose);
  const state = useGame(useShallow((s) => ({ time: s.time, money: s.money, power: s.power, active: s.active, packaging: s.packaging, pantry: s.pantry, cv: s.cv, area: s.area, rentLocked: s.rentLocked, unlocks: s.unlocks, grade: s.grade, hasCar: !!s.car, sick: s.sick, contacts: s.contacts })));
  const item = INTERACTABLES.find((i) => i.id === menu);
  if (!item) return null;
  return (
    <div className="sheet-backdrop" onPointerDown={() => openMenu(null)}>
      <div className="sheet card" onPointerDown={(e) => e.stopPropagation()}>
        <div className="sheet-title">{item.emoji} {item.name}</div>
        {item.activities.map((a) => {
          const reason = blockReason(a, state);
          return (
            <button key={a.id} className="action" disabled={!!reason} onClick={() => choose(a.id)}>
              <span className="action-emoji">{a.emoji}</span>
              <span className="action-body">
                <span>{a.label}</span>
                <span className="muted small">
                  {reason ?? activityDetail(a, state)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className="toast card">{t.text}</div>
      ))}
    </div>
  );
}
