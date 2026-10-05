import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { INTERACTABLES, type Activity, type Place } from '../content/activities';
import { AREAS } from '../content/housing';
import { HOME_XY, MAP_SPOTS, ROADS, type MapSpot } from '../content/map';
import { DRIVES } from '../content/cars';
import { fromPlace, rideBetween, rideKm, trekBetween } from '../content/phoneapps';

const driveBetween = (from: Place, to: Place) => DRIVES.find((d) => d.id === `drive-${fromPlace(from)}-${to}`);
import { blockReason, useGame } from '../store/game';
import { activityDetail } from './detail';

/** Public bus/taxi from the motor park where you dey now, if one goes there. */
function publicRoute(place: Place, to: Place): Activity | undefined {
  return INTERACTABLES.filter((i) => i.place === place)
    .flatMap((i) => i.activities)
    .find((a) => a.travelTo === to && !a.id.startsWith('hail-') && !a.id.startsWith('trek-'));
}

function Option({ a, title, note }: { a?: Activity; title: string; note?: string }) {
  const choose = useGame((s) => s.choose);
  const state = useGame(useShallow((s) => ({ time: s.time, money: s.money, power: s.power, active: s.active, packaging: s.packaging, pantry: s.pantry, cv: s.cv, area: s.area, rentLocked: s.rentLocked, unlocks: s.unlocks, grade: s.grade, hasCar: !!s.car, sick: s.sick, contacts: s.contacts })));
  const reason = note ?? (a ? blockReason(a, state) : 'No route from here');
  return (
    <button className="action" disabled={!a || !!reason} onClick={() => a && choose(a.id)}>
      <span className="action-emoji">{title.split(' ')[0]}</span>
      <span className="action-body">
        <span>{title.split(' ').slice(1).join(' ')}</span>
        <span className="muted small">{reason ?? activityDetail(a!, state)}</span>
      </span>
    </button>
  );
}

/** Label position around a node so neighbours no overlap. */
function labelAt(pos: MapSpot['label'] = 'below', selected: boolean) {
  const r = selected ? 18 : 15;
  switch (pos) {
    case 'above':
      return { y: -r - 3, textAnchor: 'middle' as const };
    case 'left':
      return { x: -r, y: 3, textAnchor: 'end' as const };
    case 'right':
      return { x: r, y: 3, textAnchor: 'start' as const };
    default:
      return { y: r + 8, textAnchor: 'middle' as const };
  }
}

/** Every map spot, with your home placed by the area you live in. */
export function useMapSpots(): MapSpot[] {
  const area = useGame((s) => s.area);
  const homeXY = HOME_XY[area];
  return [{ id: 'home', name: `${AREAS[area].name} (your area)`, short: AREAS[area].name, emoji: '🏠', x: homeXY[0], y: homeXY[1], place: 'street', label: 'right' }, ...MAP_SPOTS];
}

/** Distance and the ways to reach a spot from where you dey. */
export function TravelSheet({ sel }: { sel: MapSpot }) {
  const place = useGame((s) => s.place);
  const area = useGame((s) => s.area);
  const hasCar = useGame((s) => !!s.car);
  const here = fromPlace(place);
  const to = sel.place;
  return (
    <>
      <div className="map-sheet-title">
        {sel.emoji} {sel.name}
        {to && to !== here && <span className="muted small"> · {Math.round(rideKm(here, to) * (to === 'street' || here === 'street' ? AREAS[area].commute : 1))} km</span>}
      </div>
      {!to && <p className="muted small">{sel.note}</p>}
      {to && to === here && <p className="muted small">📍 You dey here.</p>}
      {to && to !== here && (
        <div className="list">
          <Option a={trekBetween(place, to)} title="🚶 Trek (free, but e go tire you)" />
          <Option
            a={place === 'home' ? undefined : publicRoute(place, to)}
            title="🚌 Bus / taxi"
            note={place === 'home' ? 'Comot go bus stop for your street first' : publicRoute(place, to) ? undefined : 'No direct bus from here'}
          />
          <Option a={rideBetween(place, to)} title="🚘 Book ride" />
          {hasCar && <Option a={driveBetween(place, to)} title="🚗 Drive your car (fuel only)" />}
        </div>
      )}
    </>
  );
}

export function MapView() {
  const place = useGame((s) => s.place);
  const [selected, setSelected] = useState<string | null>(null);
  const here = fromPlace(place);
  const spots = useMapSpots();
  const herePos = spots.find((s) => s.place === here) ?? spots[0];
  const sel = spots.find((s) => s.id === selected);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    sheet.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [selected]);

  return (
    <div className="map-wrap">
      <svg viewBox="0 0 300 360" className="map-svg" role="img" aria-label="Map of Abuja">
        <rect width="300" height="360" fill="#e9e2cf" />
        {/* Parks, hills and the lake */}
        <ellipse cx="248" cy="58" rx="55" ry="30" fill="#c9dcae" />
        <ellipse cx="150" cy="320" rx="80" ry="30" fill="#d5e3bb" />
        <path d="M268 176 l14 -16 l14 18 l-6 22 l-18 4 z" fill="#a89f91" />
        <ellipse cx="98" cy="190" rx="20" ry="11" fill="#8cc4e8" />
        <rect x="200" y="200" width="30" height="28" rx="6" fill="#e2d6b8" />
        {ROADS.map((r) => (
          <g key={r.name}>
            <polyline points={r.points.map((p) => p.join(',')).join(' ')} fill="none" stroke="#b8ac93" strokeWidth={r.major ? 9 : 6} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={r.points.map((p) => p.join(',')).join(' ')} fill="none" stroke={r.major ? '#f6d77a' : '#fffaf0'} strokeWidth={r.major ? 5 : 3} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        <text x="40" y="30" className="map-road-label">Kubwa Expressway</text>
        <text x="60" y="322" className="map-road-label">Airport Road</text>
        {spots.map((s) => {
          const live = !!s.place;
          const isSel = s.id === selected;
          return (
            <g key={s.id} transform={`translate(${s.x} ${s.y})`} onClick={() => setSelected(s.id)} className="map-node">
              <circle r={isSel ? 15 : 12} fill={live ? '#0d2b22' : '#9a927f'} stroke={isSel ? '#e8b04b' : '#fff'} strokeWidth={isSel ? 3 : 2} />
              <text textAnchor="middle" dominantBaseline="central" fontSize="12">{s.emoji}</text>
              <text {...labelAt(s.label, isSel)} className={`map-label ${live ? '' : 'dim'}`}>{s.short ?? s.name}</text>
            </g>
          );
        })}
        {/* You dey here */}
        <g transform={`translate(${herePos.x} ${herePos.y - 20})`} pointerEvents="none">
          <circle r="9" className="map-pulse" />
          <text textAnchor="middle" dominantBaseline="central" fontSize="14">📍</text>
        </g>
      </svg>

      {!sel && <p className="muted small">Tap any place for the map to see how to reach am. 📍 = where you dey.</p>}

      {sel && (
        <div className="map-sheet" ref={sheet}>
          <TravelSheet sel={sel} />
        </div>
      )}
    </div>
  );
}
