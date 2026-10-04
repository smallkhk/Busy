import type { Needs } from '../engine/needs';

export type Place = 'home' | 'street' | 'wuse' | 'jabi' | 'secretariat';

export const PLACE_NAMES: Record<Place, string> = {
  home: 'Your compound',
  street: 'Kubwa street',
  wuse: 'Wuse Market',
  jabi: 'Jabi Lake Mall',
  secretariat: 'Federal Secretariat',
};

export type Activity = {
  id: string;
  label: string;
  /** Shown while it runs, e.g. "Cooking indomie". */
  doing: string;
  emoji: string;
  minutes: number;
  cost?: number;
  pay?: number;
  gains: Partial<Needs>;
  requiresPower?: boolean;
  /** Allowed hours [start, end) on the 24h clock. */
  hours?: [number, number];
  /** Player leaves the room (walks out the door) while it runs. */
  away?: boolean;
  sleep?: boolean;
  /** Where the player stands to do it. Phone activities have none. */
  spot?: [number, number];
  /** Walking here moves the player to another place. */
  travelTo?: Place;
  /** A road trip: takes longer in rush hour. */
  commute?: boolean;
  /** Meals of foodstuff used up when it starts. */
  usesPantry?: number;
  requires?: { packaging?: number; cv?: number };
  /** Applied when it finishes. */
  effects?: { packaging?: number; pantry?: number; cv?: number };
  /** Shown instead of running, for content that isn't built yet. */
  locked?: string;
};

export type Interactable = {
  id: string;
  place: Place;
  name: string;
  emoji: string;
  /** Label anchor in the world. */
  label: [number, number, number];
  activities: Activity[];
};

export function ride(id: string, label: string, emoji: string, to: Place, minutes: number, cost: number, spot: [number, number]): Activity {
  return {
    id,
    label,
    doing: `On the way to ${PLACE_NAMES[to]}`,
    emoji,
    minutes,
    cost,
    gains: { energy: -6, fun: -4 },
    travelTo: to,
    away: true,
    commute: true,
    spot,
  };
}
