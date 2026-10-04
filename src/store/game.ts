import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { activityById, activityPlace, ENTRY_SPOT, EXIT_SPOT, GEN_COST, PLACE_NAMES, type Activity, type Place } from '../content/activities';
import { AREAS, moveCost, placeLabel, RENT_CYCLE_DAYS, RENT_GRACE_DAYS, rentOwed, type AreaId } from '../content/housing';
import { clockParts, formatNaira, inHours } from '../engine/clock';
import { CALL_COST, contactById, FIRST_MEET_REL, GIFT_COST, type ContactState } from '../content/contacts';
import { EVENTS } from '../content/events';
import { BRAND_COOLDOWN_DAYS, BRAND_MIN_FOLLOWERS, brandPay, followersGain, packagingGap, POST_COOLDOWN_MIN, postById } from '../content/gram';
import { effectChips, pickEvent, resolveChoice } from '../engine/events';
import { clamp, fullNeeds, LOW_NEED, NEED_KEYS, NEED_META, tickNeeds, type NeedKey, type Needs } from '../engine/needs';

export type Txn = { at: number; label: string; amount: number };
export type Toast = { id: number; text: string };
export type PhoneApp = 'home' | 'bank' | 'jobs' | 'chat' | 'map' | 'gram' | 'house' | 'contacts';

/** `total` is the actual duration (rush hour makes trips longer); old saves may lack it. */
type Active = { id: string; remaining: number; gen: boolean; total?: number; eventAt?: number };

export type EventResult = { emoji: string; title: string; text: string; chips: string[] };
export type GramPost = { emoji: string; caption: string; gain: number; at: number };

type GameState = {
  started: boolean;
  name: string;
  shirt: string;
  time: number;
  money: number;
  place: Place;
  needs: Needs;
  packaging: number;
  pantry: number;
  cv: number;
  area: AreaId;
  /** Day number when the next rent is due. */
  rentDueDay: number;
  rentLocked: boolean;
  contacts: Record<string, ContactState>;
  /** Activity ids whose requirements a contact don waive. */
  unlocks: string[];
  followers: number;
  lastPostAt: number;
  lastBrandDay: number;
  posts: GramPost[];
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
  /** Id of the event waiting for an answer; the game pauses while set. */
  event: string | null;
  eventResult: EventResult | null;
  eventHistory: Record<string, number>;
  nextEventCheck: number;

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
  post: (id: string) => void;
  brandDeal: () => void;
  callContact: (id: string) => void;
  giftContact: (id: string) => void;
  askFavour: (id: string) => void;
  payRent: () => void;
  moveTo: (area: AreaId) => void;
  answerEvent: (choice: number) => void;
  closeEvent: () => void;
  reset: () => void;
};

const START_TIME = 7 * 60; // Day 1, 7:00 AM
const START_MONEY = 45000;
const START_POS: [number, number] = [0.5, 1.2];

const BOUNDS: Record<Place, { minX: number; maxX: number; minZ: number; maxZ: number }> = {
  home: { minX: -3.6, maxX: 6.4, minZ: -2.6, maxZ: 3.6 },
  street: { minX: -8.5, maxX: 7, minZ: -2.4, maxZ: 3.2 },
  wuse: { minX: -6.5, maxX: 6.5, minZ: -1.6, maxZ: 3.4 },
  jabi: { minX: -7.5, maxX: 6.5, minZ: -2.0, maxZ: 3.4 },
  secretariat: { minX: -7, maxX: 7, minZ: -2.0, maxZ: 3.6 },
};

/** Chance per idle game hour that something happens. */
const IDLE_EVENT_CHANCE = 0.3;
/** Chance a road trip gets an event halfway. */
const COMMUTE_EVENT_CHANCE = 0.45;

const RUSH_HOURS = [7, 8, 17, 18];
const RUSH_FACTOR = 1.6;

/** Real duration of an activity started at `time`. */
export function durationAt(a: Activity, time: number, area: AreaId = 'kubwa'): number {
  const base = a.homeLeg ? a.minutes * AREAS[area].commute : a.minutes;
  return Math.round(a.commute && RUSH_HOURS.includes(clockParts(time).hour) ? base * RUSH_FACTOR : base);
}

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
  packaging: 5,
  pantry: 0,
  cv: 0,
  area: 'kubwa' as AreaId,
  rentDueDay: 1 + RENT_CYCLE_DAYS,
  rentLocked: false,
  contacts: {} as Record<string, ContactState>,
  unlocks: [] as string[],
  followers: 0,
  lastPostAt: -1e9,
  lastBrandDay: -99,
  posts: [] as GramPost[],
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
  event: null as string | null,
  eventResult: null as EventResult | null,
  eventHistory: {} as Record<string, number>,
  nextEventCheck: START_TIME + 90,
});

/** Why an activity can't start right now, or null if it can. */
export type BlockState = Pick<GameState, 'time' | 'money' | 'power' | 'active' | 'packaging' | 'pantry' | 'cv' | 'area' | 'rentLocked'> & { unlocks?: string[] };

export function blockReason(a: Activity, s: BlockState): string | null {
  if (a.locked) return a.locked;
  if (s.rentLocked && activityPlace(a.id) === 'home' && !a.travelTo) return 'Landlord don lock your door 🔒 Pay rent for phone';
  const waived = s.unlocks?.includes(a.id);
  if (!waived && a.requires?.packaging && s.packaging < a.requires.packaging) return `Need 👔 Packaging ${a.requires.packaging} (you get ${Math.round(s.packaging)})`;
  if (!waived && a.requires?.cv && s.cv < a.requires.cv) return `Dem never call you. Submit CV ${a.requires.cv - s.cv} more time`;
  if (s.active) return 'You dey do something already';
  if (a.hours && !inHours(s.time, a.hours)) {
    return `Only from ${a.hours[0]}:00 to ${a.hours[1]}:00`;
  }
  if (a.usesPantry && s.pantry < a.usesPantry) return 'No foodstuff. Buy for Wuse Market';
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
        const total = durationAt(a, s.time, s.area);
        const eventAt = a.commute && Math.random() < COMMUTE_EVENT_CHANCE ? total * randomBetween(0.3, 0.7) : undefined;
        set({
          active: { id, remaining: total, gen, total, eventAt },
          pending: null,
          money: s.money - cost,
          pantry: s.pantry - (a.usesPantry ?? 0),
          txns: txns.slice(0, 40),
        });
        if (gen) get().toast('⛽ No light, you on gen');
        if (total > a.minutes) get().toast('🚗 Rush hour! Traffic don hold for expressway');
      };

      const finish = (a: Activity) => {
        const s = get();
        const fx = a.effects;
        if (fx?.meet) meetContact(fx.meet);
        if (fx) {
          set({
            packaging: Math.min(100, s.packaging + (fx.packaging ?? 0)),
            pantry: s.pantry + (fx.pantry ?? 0),
            cv: s.cv + (fx.cv ?? 0),
          });
          if (fx.packaging) get().toast(`👔 Packaging +${fx.packaging}. You don dey look clean!`);
          if (fx.pantry) get().toast(`🧺 Foodstuff +${fx.pantry} meals. Cook am for house`);
          if (fx.cv) {
            const cv = get().cv;
            get().toast(cv >= 3 ? '📞 Dem don call you! Contract staff job don open for Secretariat' : `📄 Dem collect am. "Come back next week" 😑 (${cv}/3)`);
          }
        }
        if (a.pay) {
          set({
            money: s.money + a.pay,
            txns: [{ at: s.time, label: a.label, amount: a.pay }, ...s.txns].slice(0, 40),
          });
          get().toast(`💰 You don collect ${formatNaira(a.pay)}`);
        } else if (!a.travelTo) {
          if (!fx) get().toast(`${a.emoji} Done: ${a.label}`);
        }
        set({ active: null, ...(a.away ? { pos: EXIT_SPOT[s.place] } : {}) });
        if (a.travelTo) {
          set({ place: a.travelTo, pos: ENTRY_SPOT[a.travelTo], target: null });
          get().toast(`📍 ${placeLabel(a.travelTo, s.area, PLACE_NAMES)}`);
        }
      };

      /** First meeting adds a contact; meeting again gets you closer. Returns a chip for the UI. */
      const meetContact = (id: string): string | undefined => {
        const c = contactById(id);
        if (!c) return;
        const contacts = get().contacts;
        const known = contacts[id];
        if (known) {
          set({ contacts: { ...contacts, [id]: { ...known, rel: clamp(known.rel + 5) } } });
          return `🦵 ${c.name} +5`;
        }
        set({ contacts: { ...contacts, [id]: { rel: FIRST_MEET_REL } } });
        get().toast(`🦵 You don meet ${c.name}! ${c.role}`);
        return `🦵 New contact: ${c.name}`;
      };

      const changeRel = (deltas: Record<string, number>): string[] => {
        const contacts = { ...get().contacts };
        const chips: string[] = [];
        for (const [id, d] of Object.entries(deltas)) {
          const c = contactById(id);
          if (!c || !contacts[id]) continue;
          contacts[id] = { ...contacts[id], rel: clamp(contacts[id].rel + d) };
          chips.push(`🦵 ${c.name} ${d > 0 ? '+' : ''}${d}`);
        }
        set({ contacts });
        return chips;
      };

      const fireEvent = (trigger: 'idle' | 'commute', trip?: string) => {
        const s = get();
        const { hour, day } = clockParts(s.time);
        const rentOverdue = day > s.rentDueDay && !s.rentLocked;
        const met = Object.keys(s.contacts);
        const gap = packagingGap(s.packaging, s.money, s.area);
        const e = pickEvent(EVENTS, trigger, { place: s.place, hour, day, money: s.money, power: s.power, rentOverdue, met, gap, followers: s.followers, trip }, s.eventHistory, s.time);
        if (e) set({ event: e.id, eventHistory: { ...s.eventHistory, [e.id]: s.time }, menu: null, phone: null });
      };

      return {
        ...initial(),

        answerEvent: (index) => {
          const s = get();
          const e = EVENTS.find((x) => x.id === s.event);
          const choice = e?.choices[index];
          if (!e || !choice) return set({ event: null });
          const cost = choice.cost ?? 0;
          if (cost > s.money) return;
          const fx = resolveChoice(choice);
          const effect = fx.effect ?? {};
          const moneyDelta = (effect.money ?? 0) - cost;
          let needs = { ...s.needs };
          for (const [k, v] of Object.entries(effect.needs ?? {})) needs[k as NeedKey] = clamp(needs[k as NeedKey] + (v ?? 0));
          const lost = effect.minutes ?? 0;
          if (lost) needs = tickNeeds(needs, lost);
          set({
            event: null,
            money: s.money + moneyDelta,
            needs,
            time: s.time + lost,
            packaging: clamp(s.packaging + (effect.packaging ?? 0)),
            pantry: s.pantry + (effect.pantry ?? 0),
            cv: s.cv + (effect.cv ?? 0),
            ...(effect.power === false ? { power: false, nextPowerChange: s.time + lost + 8 * 60 } : {}),
            rentDueDay: s.rentDueDay + (effect.rentGraceDays ?? 0),
            followers: Math.max(0, Math.round(s.followers * (1 + (effect.followersPct ?? 0) / 100))),
            txns: moneyDelta ? [{ at: s.time, label: e.title, amount: moneyDelta }, ...s.txns].slice(0, 40) : s.txns,
            eventResult: {
              emoji: e.emoji,
              title: e.title,
              text: fx.text,
              chips: effectChips(effect, cost, Object.fromEntries(NEED_KEYS.map((k) => [k, NEED_META[k].emoji]))),
            },
          });
          const extra = [...(effect.meet ? [meetContact(effect.meet)] : []), ...changeRel(effect.rel ?? {})].filter((c): c is string => !!c);
          const res = get().eventResult;
          if (extra.length && res) set({ eventResult: { ...res, chips: [...res.chips, ...extra] } });
        },

        closeEvent: () => set({ eventResult: null }),

        post: (id) => {
          const s = get();
          const p = postById(id);
          if (!p) return;
          if (s.active) return get().toast('😕 Finish wetin you dey do first');
          if (p.where && !p.where.includes(s.place)) return get().toast('😕 You no dey the right place for this picture');
          if (s.time - s.lastPostAt < POST_COOLDOWN_MIN) return get().toast('😕 You just post. No spam your followers');
          if (p.cost > s.money) return get().toast(`😕 You need ${formatNaira(p.cost)}`);
          const gain = followersGain(p, s.packaging, Math.random());
          set({
            money: s.money - p.cost,
            followers: s.followers + gain,
            packaging: clamp(s.packaging + (p.packaging ?? 0)),
            lastPostAt: s.time,
            needs: { ...s.needs, fun: clamp(s.needs.fun + 5) },
            posts: [{ emoji: p.emoji, caption: p.caption, gain, at: s.time }, ...s.posts].slice(0, 5),
            txns: p.cost >= 1000 ? [{ at: s.time, label: `AbujaGram: ${p.label}`, amount: -p.cost }, ...s.txns].slice(0, 40) : s.txns,
          });
          get().toast(`📸 Posted! +${gain} followers${p.packaging ? ` · 👔 +${p.packaging}` : ''}`);
        },

        brandDeal: () => {
          const s = get();
          const { day } = clockParts(s.time);
          if (s.followers < BRAND_MIN_FOLLOWERS) return get().toast(`😕 Brands want ${BRAND_MIN_FOLLOWERS}+ followers`);
          if (day - s.lastBrandDay < BRAND_COOLDOWN_DAYS) return get().toast('😕 No brand dey DM you now. Wait small');
          const pay = brandPay(s.followers);
          set({
            money: s.money + pay,
            lastBrandDay: day,
            txns: [{ at: s.time, label: 'AbujaGram brand deal', amount: pay }, ...s.txns].slice(0, 40),
          });
          get().toast(`💼 You promote "Mama Titi Jollof" for your page. ${formatNaira(pay)} land!`);
        },

        callContact: (id) => {
          const s = get();
          const c = contactById(id);
          const cs = s.contacts[id];
          if (!c || !cs) return;
          const { day } = clockParts(s.time);
          if (cs.lastCallDay === day) return get().toast(`📞 You don call ${c.name} today already`);
          if (s.money < CALL_COST) return get().toast('😕 You no get airtime money');
          set({
            money: s.money - CALL_COST,
            needs: { ...s.needs, social: clamp(s.needs.social + 8) },
            contacts: { ...s.contacts, [id]: { ...cs, rel: clamp(cs.rel + 6), lastCallDay: day } },
          });
          get().toast(`📞 You and ${c.name} gist small. 🦵 +6`);
        },

        giftContact: (id) => {
          const s = get();
          const c = contactById(id);
          const cs = s.contacts[id];
          if (!c || !cs) return;
          const { day } = clockParts(s.time);
          if (cs.lastGiftDay !== undefined && day - cs.lastGiftDay < 3) return get().toast('🎁 Too much gift go look like say you want something 😅');
          if (s.money < GIFT_COST) return get().toast(`😕 You need ${formatNaira(GIFT_COST)}`);
          set({
            money: s.money - GIFT_COST,
            contacts: { ...s.contacts, [id]: { ...cs, rel: clamp(cs.rel + 15), lastGiftDay: day } },
            txns: [{ at: s.time, label: `Gift for ${c.name}`, amount: -GIFT_COST }, ...s.txns].slice(0, 40),
          });
          get().toast(`🎁 ${c.name} like the gift well well. 🦵 +15`);
        },

        askFavour: (id) => {
          const s = get();
          const c = contactById(id);
          const cs = s.contacts[id];
          if (!c || !cs) return;
          const { day } = clockParts(s.time);
          const f = c.favour;
          if (cs.rel < f.minRel) return get().toast(`😕 ${c.name} never know you reach. Need 🦵 ${f.minRel}`);
          if (cs.lastFavourDay !== undefined && day - cs.lastFavourDay < f.cooldownDays) return get().toast(`😕 ${c.name} just help you. Wait small`);
          const fx = f.effect;
          set({
            money: s.money + (fx.money ?? 0),
            cv: s.cv + (fx.cv ?? 0),
            rentDueDay: s.rentDueDay + (fx.rentGraceDays ?? 0),
            unlocks: fx.unlock && !s.unlocks.includes(fx.unlock) ? [...s.unlocks, fx.unlock] : s.unlocks,
            contacts: { ...s.contacts, [id]: { ...cs, rel: clamp(cs.rel - 15), lastFavourDay: day } },
            txns: fx.money ? [{ at: s.time, label: `${c.name}: ${f.label}`, amount: fx.money }, ...s.txns].slice(0, 40) : s.txns,
            phone: null,
            eventResult: { emoji: c.emoji, title: `${c.name} don help you`, text: f.text, chips: [...effectChips(fx), `🦵 ${c.name} -15`] },
          });
        },

        payRent: () => {
          const s = get();
          const { day } = clockParts(s.time);
          if (s.rentDueDay - day > 10) return get().toast(`🏠 Rent never due. Next one na Day ${s.rentDueDay}`);
          const owed = rentOwed(s.area, day, s.rentDueDay);
          if (owed > s.money) return get().toast(`😕 You need ${formatNaira(owed)} for rent`);
          set({
            money: s.money - owed,
            rentDueDay: s.rentDueDay + RENT_CYCLE_DAYS,
            rentLocked: false,
            txns: [{ at: s.time, label: `Rent: ${AREAS[s.area].home}`, amount: -owed }, ...s.txns].slice(0, 40),
          });
          get().toast(s.rentLocked ? '🔓 Landlord don open your door. Sorry o!' : `🏠 Rent paid till Day ${s.rentDueDay + RENT_CYCLE_DAYS}`);
        },

        moveTo: (to) => {
          const s = get();
          const { day } = clockParts(s.time);
          if (to === s.area) return;
          if (s.active) return get().toast('😕 Finish wetin you dey do first');
          if (s.rentLocked || day > s.rentDueDay) return get().toast('😕 Clear your rent first. Landlord no go release your load');
          const cost = moveCost(to);
          if (cost > s.money) return get().toast(`😕 You need ${formatNaira(cost)} to move`);
          set({
            money: s.money - cost,
            area: to,
            rentDueDay: day + RENT_CYCLE_DAYS * 2,
            packaging: clamp(s.packaging + AREAS[to].packaging - AREAS[s.area].packaging),
            place: 'home',
            pos: START_POS,
            target: null,
            pending: null,
            phone: null,
            txns: [{ at: s.time, label: `Moved to ${AREAS[to].home}`, amount: -cost }, ...s.txns].slice(0, 40),
          });
          get().toast(`📦 You don pack enter ${AREAS[to].home}! ${AREAS[to].emoji}`);
        },

        start: (name, shirt) => set({ ...initial(), started: true, name: name.trim() || 'Abuja Hustler', shirt }),

        tick: (realSeconds) => {
          const s = get();
          if (!s.started || s.event || s.eventResult) return;
          const dtReal = Math.min(realSeconds, 0.25);
          const a = s.active ? activityById(s.active.id) : undefined;

          let needs = s.needs;
          let time = s.time;

          if (s.active && a) {
            // Fast-forward while busy: every activity takes ~4 real seconds.
            const total = s.active.total ?? a.minutes;
            const speed = Math.max(10, total / 4);
            const step = Math.min(dtReal * speed, s.active.remaining);
            needs = tickNeeds(needs, step, { gains: a.gains, activityMinutes: total, sleeping: a.sleep });
            time += step;
            const remaining = s.active.remaining - step;
            set({ needs, time, active: { ...s.active, remaining } });
            if (s.active.eventAt !== undefined && remaining <= s.active.eventAt && remaining > 0) {
              set({ active: { ...s.active, remaining, eventAt: undefined } });
              fireEvent('commute', a.id);
            } else if (remaining <= 0) finish(a);
          } else {
            const step = dtReal; // 1 real second = 1 game minute
            needs = tickNeeds(needs, step);
            time += step;
            set({ needs, time });
            if (!s.target && !s.menu && !s.phone && time >= s.nextEventCheck) {
              set({ nextEventCheck: time + 60 });
              if (Math.random() < IDLE_EVENT_CHANCE) fireEvent('idle');
            }
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
          if (cur.day !== prev.day) {
            now.toast(`🌅 Day ${cur.day} for Abuja. Make today count!`);
            const { rentDueDay, rentLocked, area } = get();
            const left = rentDueDay - cur.day;
            if (left === 7 || left === 1) now.toast(`🏠 Rent go due in ${left} day${left > 1 ? 's' : ''}: ${formatNaira(AREAS[area].rent)}`);
            if (left === 0) now.toast('🏠 Rent don due today! Pay for phone → 🏠 Rent');
            // People forget you if you no dey check on them
            const contacts = Object.fromEntries(
              Object.entries(get().contacts).map(([id, c]) => [id, { ...c, rel: Math.max(5, c.rel - 1) }]),
            );
            set({ contacts });
            // Followers drift away if you no post for 2 days
            const g = get();
            if (g.time - g.lastPostAt > 2 * 24 * 60 && g.followers > 0) set({ followers: Math.floor(g.followers * 0.98) });
            if (left < -RENT_GRACE_DAYS && !rentLocked) {
              set({ rentLocked: true });
              now.toast('🔒 Landlord don lock your room! Pay rent + 10% penalty to enter');
            }
          }
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
        packaging: s.packaging,
        pantry: s.pantry,
        cv: s.cv,
        area: s.area,
        rentDueDay: s.rentDueDay,
        rentLocked: s.rentLocked,
        contacts: s.contacts,
        unlocks: s.unlocks,
        followers: s.followers,
        lastPostAt: s.lastPostAt,
        lastBrandDay: s.lastBrandDay,
        posts: s.posts,
        power: s.power,
        nextPowerChange: s.nextPowerChange,
        pos: s.pos,
        active: s.active,
        txns: s.txns,
        lowWarned: s.lowWarned,
        event: s.event,
        eventResult: s.eventResult,
        eventHistory: s.eventHistory,
        nextEventCheck: s.nextEventCheck,
      }),
    },
  ),
);
