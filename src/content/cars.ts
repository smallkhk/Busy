import { RIDES, RIDE_PLACES, rideKm } from './phoneapps';
import { PLACE_NAMES, type Activity } from './common';

export type Car = { id: string; name: string; emoji: string; price: number; packaging: number; color: string; blurb: string; /** Fuel use. */ litresPer100: number };

export const CARS: Car[] = [
  { id: 'corolla', name: 'Tokunbo Corolla', emoji: '🚗', price: 4500000, packaging: 12, color: '#b9bcc2', blurb: 'Abuja workhorse. Fuel friendly, spare parts everywhere.', litresPer100: 8 },
  { id: 'suv', name: 'Lexus-style SUV', emoji: '🚙', price: 14000000, packaging: 25, color: '#20232a', blurb: 'Tinted glass. People go start to call you "Chairman".', litresPer100: 13 },
  { id: 'benz', name: 'Benz SUV', emoji: '🚘', price: 48000000, packaging: 45, color: '#f4f4f4', blurb: 'When you park, the whole street go look. Real one, no rent 😎', litresPer100: 16 },
];

export const carById = (id: string) => CARS.find((c) => c.id === id);

/** Tank size in litres; a new car comes with this much inside. */
export const TANK = 50;
export const START_FUEL = 20;
/** Litres a ride-app or airport-taxi shift burns. */
export const SHIFT_LITRES = 9;

/** Litres a drive or driving job needs with this car. */
export function litresFor(a: { id: string; requires?: { car?: boolean } }, carId: string | undefined): number {
  const car = carId ? carById(carId) : undefined;
  if (!car || !a.requires?.car) return 0;
  const m = a.id.match(/^drive-(\w+)-(\w+)$/);
  if (m) return Math.round(rideKm(m[1] as never, m[2] as never) * car.litresPer100) / 100;
  if (a.id === 'hailing' || a.id === 'airport-shift') return SHIFT_LITRES;
  return 0;
}
/** You get this share of the price back when you sell or trade in. */
export const RESALE = 0.7;
export const repairCost = (condition: number) => Math.round((100 - condition) * 1500);

const where = (p: string) => (p === 'street' ? 'your area (home)' : PLACE_NAMES[p as keyof typeof PLACE_NAMES]);

/** Driving yourself: as fast as a booked ride, you only pay fuel. */
export const DRIVES: Activity[] = RIDE_PLACES.flatMap((from) =>
  RIDE_PLACES.filter((to) => to !== from).map((to): Activity => {
    const ride = RIDES.find((r) => r.id === `hail-${from}-${to}`)!;
    return {
      id: `drive-${from}-${to}`,
      label: `Drive go ${where(to)}`,
      /* No cash cost: it burns fuel from your tank (see litresFor). */
      doing: `Driving go ${where(to)} 🎶`,
      emoji: '🚗',
      minutes: ride.minutes,
      gains: { fun: 3 },
      travelTo: to,
      away: true,
      commute: true,
      homeLeg: ride.homeLeg,
      requires: { car: true },
    };
  }),
);

export const HAILING_JOB: Activity = {
  id: 'hailing',
  label: 'Drive for ride app (6 hrs)',
  doing: 'Carrying passengers round Abuja 🚕',
  emoji: '🚕',
  minutes: 360,
  pay: 22000,
  gains: { energy: -25, fun: -5, social: 10 },
  hours: [6, 22],
  away: true,
  requires: { car: true },
};
