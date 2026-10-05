import { useEffect } from 'react';
import { clockParts } from '../engine/clock';
import { useGame } from '../store/game';
import { setAmbience, sfx, unlockAudio } from './sound';

const AMBIENCE = {
  street: 'street',
  wuse: 'market',
  jabi: 'lake',
  secretariat: 'murmur',
  hospital: 'murmur',
  lounge: 'lounge',
} as const;

function ambienceFor(place: string, minutes: number) {
  if (place === 'home') {
    const { hour } = clockParts(minutes);
    return hour >= 20 || hour < 6 ? 'night' : 'none';
  }
  return AMBIENCE[place as keyof typeof AMBIENCE] ?? 'none';
}

/** Listens to the game and plays the right sounds. Renders nothing. */
export function AudioDirector() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      unlockAudio();
      if ((e.target as HTMLElement | null)?.closest('button')) sfx.click();
    };
    document.addEventListener('pointerdown', onDown);

    setAmbience(ambienceFor(useGame.getState().place, useGame.getState().time));
    const unsub = useGame.subscribe((s, prev) => {
      if (s.place !== prev.place) sfx.whoosh();
      const hourChanged = Math.floor(s.time / 60) !== Math.floor(prev.time / 60);
      if (s.place !== prev.place || hourChanged) setAmbience(s.phone === 'map' ? 'none' : ambienceFor(s.place, s.time));
      if (s.phone !== prev.phone && (s.phone === 'map' || prev.phone === 'map')) setAmbience(s.phone === 'map' ? 'none' : ambienceFor(s.place, s.time));
      if (s.money - prev.money >= 1000) sfx.cash();
      if (s.event && s.event !== prev.event) (s.event.startsWith('accident') ? sfx.crash : sfx.alert)();
      if (s.eventResult && s.eventResult !== prev.eventResult && /🎉|don help you|Promotion/.test(s.eventResult.title + s.eventResult.emoji)) sfx.fanfare();
      if (s.toasts.length > prev.toasts.length && s.money === prev.money) sfx.pop();
    });
    return () => {
      document.removeEventListener('pointerdown', onDown);
      unsub();
    };
  }, []);
  return null;
}
