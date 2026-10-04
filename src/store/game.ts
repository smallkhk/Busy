import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { activityById, ENTRY_SPOT, EXIT_SPOT, GEN_COST, PLACE_NAMES, type Activity, type Place } from '../content/activities';
import { clockParts, formatNaira, inHours } from '../engine/clock';
import { fullNeeds, LOW_NEED, NEED_KEYS, NEED_META, tickNeeds, type NeedKey, type Needs } from '../engine/needs';

export type Txn = { at: number; label: string; amount: number };
export type Toast = { id: number; text: string };
export type PhoneApp = 'home' | 'bank' | 'jobs' | 'chat' | 'map' | 'gram';

type Active = { id: string; remaining: number; gen: boolean };

type GameState = {
  started: boolean;
  name: string;
  shirt: string;
  time: number;
  money: number;
  place: Place;
  needs: Needs;
  power: boolean;
  nextPowerChange: number;
  pos: [number, number];
  target: [number, number] | null;
  pending: string | null;
  active: Active | null;
  txns: Txn[];
  toasts: Toast[];
  lowWarned: Partial<Record<NeedKey, boolean>>;
  menu: string | null;
  phone: PhoneApp | null;

  start: (name: string, shirt: string) => void;
  tick: (realSeconds: number) => void;
  walkTo: (x: number, z: number) => void;
  choose: (activityId: string) => void;
  arrive: (pos: [number, number]) => void;
  cancel: () => void;
  toast: (text: string) => void;
  dismissToast: (id: number) => void;
  openMenu: (id: string | null) => void;
  openPhone: (app: PhoneApp | null) => void;
  reset: () => void;
};

const START_TIME = 7 * 60; // Day 1, 7:00 AM
const START_MONEY = 45000;
const START_POS: [number, number] = [0.5, 1.2];

const BOUNDS: Record<Place, { minX: number; maxX: number; minZ: number; maxZ: number }> = {
  home: { minX: -3.6, maxX: 6.4, minZ: -2.6, maxZ: 3.6 },
  street: { minX: -8.5, maxX: 7, minZ: -2.4, maxZ: 3.2 },
};

let toastId = 0;

const randomBetween = (a: number, b: number) => a + Math.random() * (b - a);

const initial = () => ({
  started: false,
  name: '',
  shirt: '#2f9e6b',
  time: START_TIME,
  money: START_MONEY,
  place: 'home' as Place,
  needs: fullNeeds(),
  power: true,
  nextPowerChange: START_TIME + 180,
  pos: START_POS,
  target: null,
  pending: null,
  active: null,
  txns: [{ at: START_TIME, label: 'Money wey you carry land Abuja', amount: START_MONEY }],
  toasts: [],
  lowWarned: {},
  menu: null,
  phone: null,
});

/** Why an activity can't start right now, or null if it can. */
export function blockReason(a: Activity, s: Pick<GameState, 'time' | 'money' | 'power' | 'active'>): string | null {
  if (a.locked) return a.locked;
  if (s.active) return 'You dey do something already';
  if (a.hours && !inHours(s.time, a.hours)) {
    return `Only from ${a.hours[0]}:00 to ${a.hours[1]}:00`;
  }
  const cost = (a.cost ?? 0) + (a.requiresPower && !s.power ? GEN_COST : 0);
  if (cost > s.money) return `You need ${formatNaira(cost)}`;
  return null;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      const startActivity = (id: string) => {
        const s = get();
        const a = activityById(id);
        if (!a) return;
        const reason = blockReason(a, s);
        if (reason) {
          get().toast(`😕 ${reason}`);
          set({ pending: null });
          return;
        }
        const gen = !!a.requiresPower && !s.power;
        const cost = (a.cost ?? 0) + (gen ? GEN_COST : 0);
        const txns = [...s.txns];
        if (a.cost) txns.unshift({ at: s.time, label: a.label, amount: -a.cost });
        if (gen) txns.unshift({ at: s.time, label: 'Fuel for gen', amount: -GEN_COST });
        set({
          active: { id, remaining: a.minutes, gen },
          pending: null,
          money: s.money - cost,
          txns: txns.slice(0, 40),
        });
        if (gen) get().toast('⛽ No light, you on gen');
      };

      const finish = (a: Activity) => {
        const s = get();
        if (a.pay) {
          set({
            money: s.money + a.pay,
            txns: [{ at: s.time, label: a.label, amount: a.pay }, ...s.txns].slice(0, 40),
          });
          get().toast(`💰 You don collect ${formatNaira(a.pay)}`);
        } else if (!a.travelTo) {
          get().toast(`${a.emoji} Done: ${a.label}`);
        }
        set({ active: null, ...(a.away ? { pos: EXIT_SPOT[s.place] } : {}) });
        if (a.travelTo) {
          set({ place: a.travelTo, pos: ENTRY_SPOT[a.travelTo], target: null });
          get().toast(`📍 ${PLACE_NAMES[a.travelTo]}`);
        }
      };

      return {
        ...initial(),

        start: (name, shirt) => set({ ...initial(), started: true, name: name.trim() || 'Abuja Hustler', shirt }),

        tick: (realSeconds) => {
          const s = get();
          if (!s.started) return;
          const dtReal = Math.min(realSeconds, 0.25);
          const a = s.active ? activityById(s.active.id) : undefined;

          let needs = s.needs;
          let time = s.time;

          if (s.active && a) {
            // Fast-forward while busy: every activity takes ~4 real seconds.
            const speed = Math.max(10, a.minutes / 4);
            const step = Math.min(dtReal * speed, s.active.remaining);
            needs = tickNeeds(needs, step, { gains: a.gains, activityMinutes: a.minutes, sleeping: a.sleep });
            time += step;
            const remaining = s.active.remaining - step;
            set({ needs, time, active: { ...s.active, remaining } });
            if (remaining <= 0) finish(a);
          } else {
            const step = dtReal; // 1 real second = 1 game minute
            needs = tickNeeds(needs, step);
            time += step;
            set({ needs, time });
          }

          // NEPA/AEDC light schedule
          if (time >= s.nextPowerChange) {
            const power = !s.power;
            set({ power, nextPowerChange: time + (power ? randomBetween(120, 480) : randomBetween(60, 300)) });
            get().toast(power ? '💡 Light don come! UP AEDC!' : '🕯️ AEDC don take light 😩');
            const cur = get().active;
            const curA = cur && activityById(cur.id);
            if (!power && cur && curA?.requiresPower && !cur.gen) {
              set({ active: null });
              get().toast('📺 TV don off. Gen dey for 1k if you wan continue');
            }
          }

          // Low-need warnings, once per dip
          const warned = { ...get().lowWarned };
          let changed = false;
          for (const k of NEED_KEYS) {
            if (needs[k] < LOW_NEED && !warned[k]) {
              warned[k] = true;
              changed = true;
              get().toast(`${NEED_META[k].emoji} Your ${NEED_META[k].label.toLowerCase()} don low o!`);
            } else if (needs[k] >= LOW_NEED + 10 && warned[k]) {
              warned[k] = false;
              changed = true;
            }
          }
          if (changed) set({ lowWarned: warned });

          // Faint from tiredness
          const now = get();
          if (now.needs.energy <= 0 && !now.active) {
            now.toast('😵 You don faint from tiredness!');
            set({ target: null, pending: null, active: { id: 'nap', remaining: 60, gen: false } });
          }
          if (now.needs.bladder <= 0) {
            set({ needs: { ...now.needs, bladder: 100, hygiene: 0 } });
            now.toast('🙈 Omo… accident happen. You need bath now now');
          }

          // New day greeting
          const prev = clockParts(s.time);
          const cur = clockParts(time);
          if (cur.day !== prev.day) now.toast(`🌅 Day ${cur.day} for Abuja. Make today count!`);
        },

        walkTo: (x, z) => {
          const { active, place } = get();
          if (active) return;
          const b = BOUNDS[place];
          set({
            target: [Math.min(b.maxX, Math.max(b.minX, x)), Math.min(b.maxZ, Math.max(b.minZ, z))],
            pending: null,
            menu: null,
          });
        },

        choose: (activityId) => {
          const s = get();
          const a = activityById(activityId);
          if (!a) return;
          const reason = blockReason(a, s);
          set({ menu: null, phone: null });
          if (reason) {
            get().toast(`😕 ${reason}`);
            return;
          }
          const spot = a.spot ?? (a.away ? EXIT_SPOT[s.place] : null);
          if (spot) set({ target: spot, pending: a.id });
          else startActivity(a.id);
        },

        arrive: (pos) => {
          const { pending } = get();
          set({ pos, target: null });
          if (pending) startActivity(pending);
        },

        cancel: () => {
          const s = get();
          const a = s.active && activityById(s.active.id);
          if (!a) return;
          set({ active: null, ...(a.away ? { pos: EXIT_SPOT[s.place] } : {}) });
          get().toast(a.pay ? '🚶 You comot from work early. No pay o' : '✋ You stop am');
        },

        toast: (text) => {
          const id = ++toastId;
          set((s) => ({ toasts: [...s.toasts, { id, text }].slice(-3) }));
          setTimeout(() => get().dismissToast(id), 3200);
        },

        dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

        openMenu: (id) => set({ menu: id, phone: null }),

        openPhone: (app) => set({ phone: app, menu: null }),

        reset: () => set({ ...initial() }),
      };
    },
    {
      name: 'abuja-life-save-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        started: s.started,
        name: s.name,
        shirt: s.shirt,
        time: s.time,
        money: s.money,
        place: s.place,
        needs: s.needs,
        power: s.power,
        nextPowerChange: s.nextPowerChange,
        pos: s.pos,
        active: s.active,
        txns: s.txns,
        lowWarned: s.lowWarned,
      }),
    },
  ),
);
