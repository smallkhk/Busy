import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { activityById, activityPlace, ENTRY_SPOT, PLACE_NAMES, type Activity, type Place } from '../content/activities';
import { entrySpot, exitSpot, homeBounds, homeSpot } from '../content/homeLayout';
import { CAMPUS_PLACES } from '../content/campus';
import { CELL_X, CELL_Z, cellOfPlace, currentCell, HOME_CELLS, inGrid, placeAt, ROAD_HALF, ROAD_Z, route, type Cell } from '../content/worldmap';
import { AD_BIZ_BOOST } from '../content/billboards';
import { appointChance, CAMPAIGN_DAYS, canRun, electionWon, MOVES, moveSupport, NO_POLITICS, OFFICES, startingSupport, TERM_DAYS, type CampaignMove, type Politics } from '../content/politics';
import { admissible, cgpaOf, examGrade, gradPay, jambScore, LECTURES_PER_LEVEL, levelName, MAX_STUDY, NO_SCHOOL, PASS_GP, programmeById, RUNS_COST, RUNS_POINTS, RUNS_SCAM, schoolBlock, STRIKE_CHANCE, STRIKE_DAYS, degreeClass, type ProgrammeId, type School, type SchoolNeed } from '../content/school';
import { courseById, GYM_DAYS, GYM_FEE, sickDodge, workEnergyFactor, type CourseId } from '../content/learning';
import { festivalOn } from '../content/festivals';
import { EDUCATIONS, familyById, ORIGINS, type Birth } from '../content/birth';
import { DEFAULT_LOOK, HAIR_COST, OUTFITS, type Hair, type Look, type Outfit } from '../content/fashion';
import { driveWear } from '../content/minigames';
import { areaAllows, genCostFor, homeItemById, TV_ACTIVITIES, WIFI_FREE } from '../content/homeup';
import { AREAS, homeTier, moveCost, placeLabel, PROPERTY_SELL_FEE, propertyValue, RENT_CYCLE_DAYS, RENT_GRACE_DAYS, rentOwed, type AreaId, type Property } from '../content/housing';
import { activityRealSeconds, clockParts, formatNaira, inHours, realMinutes, watMidnight } from '../engine/clock';
import { CALL_COST, contactById, FIRST_MEET_REL, GIFT_COST, longLeg, type ContactState } from '../content/contacts';
import { badDayChance, businessById, dailyNet, MAX_BIZ_LEVEL, MAX_STAFF, upgradeCost, wageOf, type OwnedBusiness } from '../content/business';
import { GRADES, OFFICE_SHIFT_ID, payFor, promotionBlock } from '../content/career';
import { carById, litresFor, repairCost, RESALE, RESPRAY_COST, START_FUEL, TANK } from '../content/cars';
import { EVENTS } from '../content/events';
import { rollSickness, SICK_DRAIN, SICKNESS, type Sickness } from '../content/health';
import { ALL_GOALS } from '../content/goals';
import { LOAN_DAYS, LOAN_FEE, LOAN_MAX, SAVINGS_DAILY_RATE, TOKEN_COST } from '../content/phoneapps';
import { BRAND_COOLDOWN_DAYS, BRAND_MIN_FOLLOWERS, brandPay, followersGain, packagingGap, POST_COOLDOWN_MIN, postById } from '../content/gram';
import { npcsAt, TALK_MINUTES, TALK_REL } from '../content/npcs';
import { LOVE_GIFT_COST, ASK_OUT_AT, DAILY_COOL, DATE_TIERS, dateInterest, matchById, matchChance, officialPartner, PROPOSE_AFTER_DAYS, RING_COST, TEXT_INTEREST, WEDDING_COST, WEDDING_PACKAGING, type Love } from '../content/dating';
import { combinedMods, nextWeather, priceOf, tripFactor, weatherSpell, WORLD_NEWS, type ActiveNews, type Weather } from '../content/world';
import { effectChips, pickEvent, resolveChoice, type EventContext } from '../engine/events';
import { clamp, fullNeeds, LOW_NEED, NEED_KEYS, NEED_META, tickNeeds, type NeedKey, type Needs } from '../engine/needs';

/** Where the real time comes from (tests swap in a fake clock). */
let clock: () => number = () => Date.now();
export const setClockSource = (fn: () => number) => (clock = fn);

export type Txn = { at: number; label: string; amount: number };
export type Toast = { id: number; text: string };
export type PhoneApp = 'home' | 'bank' | 'jobs' | 'chat' | 'map' | 'gram' | 'house' | 'contacts' | 'chop' | 'ride' | 'news' | 'goals' | 'biz' | 'cars' | 'gist' | 'love' | 'account' | 'rankings' | 'style' | 'learn' | 'school' | 'politics' | 'admin';

/** `total` is the actual duration (rush hour makes trips longer); old saves may lack it. */
type Active = { id: string; remaining: number; gen: boolean; total?: number; eventAt?: number; /** Mini-game score 0–1. */ bonus?: number };

export type EventResult = { emoji: string; title: string; text: string; chips: string[] };
export type GramPost = { emoji: string; caption: string; gain: number; at: number };

export type GameState = {
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
  /** Counters for goals: meals, jobs, trips, treks, sleeps, rentPaid, bottles, visit-<place>. */
  stats: Record<string, number>;
  /** Civil service grade index into GRADES. */
  grade: number;
  /** Office shifts done at the current grade. */
  gradeShifts: number;
  businesses: Record<string, OwnedBusiness>;
  car: { id: string; condition: number; /** Litres in the tank (old saves: undefined = START_FUEL). */ fuel?: number; /** Paint colour you chose. */ paint?: string } | null;
  sick: Sickness | null;
  /** Police suspicion 0–100. Goes down small small every day. */
  heat: number;
  /** Real time (ms) your billboard ad runs till: business earns more meanwhile. */
  adBoostUntil: number;
  /** Land and houses you own. */
  properties: Partial<Record<AreaId, Property>>;
  /** Last day whose morning rollover ran. */
  lastDay: number;
  /** Your political career. */
  politics: Politics;
  /** Courses you don enroll for, with classes done. */
  courses: Partial<Record<CourseId, number>>;
  /** Courses you don finish. */
  skills: CourseId[];
  /** UniAbuja full-time: JAMB, admission, levels, results. */
  school?: School;
  /** 0–100: how fit you be. */
  fitness: number;
  /** Last game day your gym membership covers. */
  gymUntil: number;
  /** How you look: outfit, hair and skin. */
  look: Look;
  /** Outfits you own. */
  wardrobe: Outfit[];
  /** The life you born into (old saves: undefined). */
  birth?: Birth;
  /** Real timestamp of day 1, 00:00 Abuja time. When set, the clock follows real life. */
  epoch?: number;
  /** Things you don buy for your house. */
  homeUps: string[];
  /** Abuja Love: people you matched with. */
  loves: Record<string, Love>;
  /** Profiles you don swipe already. */
  swiped: string[];
  /** Story flags and the day each was set. */
  flags: Record<string, number>;
  weather: Weather;
  nextWeatherChange: number;
  /** World news running now, with the day it ends. */
  news: ActiveNews[];
  /** Trip in progress when the current event fired. */
  eventTrip: string | null;
  hasNet: boolean;
  /** Goal ids already completed. */
  goals: string[];
  savings: number;
  savingsInterest: number;
  /** Ego Loan: what you owe and when. */
  loan: { owed: number; dueDay: number } | null;
  followers: number;
  lastPostAt: number;
  lastBrandDay: number;
  posts: GramPost[];
  power: boolean;
  nextPowerChange: number;
  pos: [number, number];
  target: [number, number] | null;
  /** Waypoints still to walk after `target` (local to the block you are in). */
  route: [number, number][];
  /** Grid block you are in when you are out on the road between places. */
  cell?: Cell | null;
  /** The last place you were at before you stepped onto the road. */
  near?: Place;
  /** You are behind the wheel, driving round town. */
  driving: boolean;
  /** Sitting, waving or dancing where you stand (cleared when you move or start something). */
  pose: Pose | null;
  /** Where you left your car (null: at your gate at home). Position is local to the block. */
  parked?: { cell: Cell; pos: [number, number]; rot: number } | null;
  pending: string | null;
  active: Active | null;
  txns: Txn[];
  toasts: Toast[];
  lowWarned: Partial<Record<NeedKey, boolean>>;
  menu: string | null;
  /** Mini-game waiting to be played before an activity starts. */
  minigame: { id: string; kind: NonNullable<Activity['minigame']> } | null;
  /** Contact whose talk sheet is open. */
  npcMenu: string | null;
  phone: PhoneApp | null;
  /** Id of the event waiting for an answer; the game pauses while set. */
  event: string | null;
  eventResult: EventResult | null;
  eventHistory: Record<string, number>;
  nextEventCheck: number;

  start: (name: string, shirt: string, look?: Look, birth?: Birth) => void;
  buyOutfit: (id: Outfit) => void;
  enroll: (id: CourseId) => void;
  /** Accept admission into a UniAbuja programme. */
  admit: (id: ProgrammeId) => void;
  /** Pay this session's school fees. */
  payFees: () => void;
  /** Pay somebody to "sort" your JAMB score (sometimes na scam). */
  sortAdmission: () => void;
  /** Buy the nomination form (or lobby for an appointment). */
  declare: (target: number) => void;
  campaign: (move: CampaignMove) => void;
  joinGym: () => void;
  wearOutfit: (id: Outfit) => void;
  setHair: (id: Hair) => void;
  setShirt: (color: string) => void;
  tick: (realSeconds: number) => void;
  /** Real-time clock: move old saves over, and catch up on time spent away. */
  syncClock: () => void;
  walkTo: (x: number, z: number) => void;
  /** You walked across a block edge: move the origin to the next block. */
  shiftCell: (dc: number, dr: number) => void;
  /** Walk (or drive, if you are in your car) through town to a place, following the roads. */
  headTo: (place: Place) => void;
  /** Sit down, wave or dance (null stands you up). */
  setPose: (pose: Pose | null) => void;
  /** Get into your car (walks you to it first if it is parked away). */
  enterCar: () => void;
  /** Park where you are and get out. */
  parkCar: () => void;
  choose: (activityId: string) => void;
  arrive: (pos: [number, number]) => void;
  cancel: () => void;
  toast: (text: string) => void;
  dismissToast: (id: number) => void;
  openMenu: (id: string | null) => void;
  openPhone: (app: PhoneApp | null) => void;
  buyCar: (id: string, paint?: string) => void;
  sellCar: () => void;
  repairCar: () => void;
  resprayCar: (paint: string) => void;
  promote: () => void;
  buyBusiness: (id: string) => void;
  upgradeBusiness: (id: string) => void;
  /** Hire (+1) or sack (-1) a worker. */
  setStaff: (id: string, delta: number) => void;
  buyHomeItem: (id: string) => void;
  /** Pay for a billboard you don rent; boosts business till `until` (real ms). */
  payForAd: (cost: number, label: string, until: number) => void;
  saveMoney: (amount: number) => void;
  withdrawSavings: (amount: number) => void;
  takeLoan: (amount: number) => void;
  repayLoan: () => void;
  sendMoney: (to: string, amount: number) => void;
  /** Money in or out from outside the game (friend transfers). */
  adjustMoney: (delta: number, label: string) => void;
  giftLove: (id: string) => void;
  buyToken: () => void;
  post: (id: string) => void;
  brandDeal: () => void;
  callContact: (id: string) => void;
  openNpc: (id: string | null) => void;
  /** Finish the mini-game with a score 0–1 (null = skipped). */
  playMinigame: (score: number | null) => void;
  swipe: (id: string, like: boolean) => void;
  textLove: (id: string) => void;
  dateLove: (id: string, tier: string) => void;
  askOut: (id: string) => void;
  propose: (id: string) => void;
  wed: (id: string) => void;
  breakUp: (id: string) => void;
  /** Walk up to a stranger and introduce yourself. */
  introduce: (id: string) => void;
  /** Gist face to face with a contact you know. */
  talkTo: (id: string) => void;
  giftContact: (id: string) => void;
  askFavour: (id: string) => void;
  payRent: () => void;
  moveTo: (area: AreaId) => void;
  /** Buy land (Kuje) or a finished house (Guzape). */
  buyProperty: (area: AreaId) => void;
  buildHouse: (area: AreaId) => void;
  toggleRentOut: (area: AreaId) => void;
  sellProperty: (area: AreaId) => void;
  answerEvent: (choice: number) => void;
  closeEvent: () => void;
  reset: () => void;
};

const START_TIME = 7 * 60; // Day 1, 7:00 AM
const START_MONEY = 45000;
const START_POS: [number, number] = [0.5, 1.2];

const BOUNDS: Record<Place, { minX: number; maxX: number; minZ: number; maxZ: number }> = {
  home: { minX: -3.6, maxX: 6.4, minZ: -2.6, maxZ: 3.6 },
  street: { minX: -13, maxX: 13, minZ: -2.4, maxZ: 3.2 },
  wuse: { minX: -13, maxX: 13, minZ: -1.6, maxZ: 3.4 },
  jabi: { minX: -13, maxX: 13, minZ: -2.0, maxZ: 3.4 },
  secretariat: { minX: -13, maxX: 13, minZ: -2.0, maxZ: 3.6 },
  hospital: { minX: -13, maxX: 13, minZ: -1.8, maxZ: 3.6 },
  lounge: { minX: -13, maxX: 13, minZ: -2.0, maxZ: 3.4 },
  maitama: { minX: -13, maxX: 13, minZ: -1.8, maxZ: 3.6 },
  asokoro: { minX: -13, maxX: 13, minZ: -1.8, maxZ: 3.6 },
  garki: { minX: -13, maxX: 13, minZ: -1.8, maxZ: 3.6 },
  nyanya: { minX: -13, maxX: 13, minZ: -1.8, maxZ: 3.6 },
  airport: { minX: -13, maxX: 13, minZ: -1.8, maxZ: 3.6 },
  utako: { minX: -13, maxX: 13, minZ: -1.8, maxZ: 3.6 },
  mararaba: { minX: -13, maxX: 13, minZ: -1.8, maxZ: 3.6 },
  park: { minX: -13, maxX: 13, minZ: -1.8, maxZ: 3.6 },
  stadium: { minX: -13, maxX: 13, minZ: -1.8, maxZ: 3.6 },
  uniabuja: { minX: -6, maxX: 6, minZ: 3, maxZ: 6 },
  campus: { minX: -32, maxX: 32, minZ: -26, maxZ: 13.5 },
  lt: { minX: -8.5, maxX: 8.5, minZ: -3.5, maxZ: 5.8 },
  unilib: { minX: -8.5, maxX: 8.5, minZ: -4.5, maxZ: 5.6 },
  road: { minX: -CELL_X / 2, maxX: CELL_X / 2, minZ: ROAD_Z - ROAD_HALF, maxZ: ROAD_Z + ROAD_HALF },
};

/** Where you can stand inside a place's block (the road grid is added by worldmap). */
const plazaOf = (p: Place) => (p === 'home' || p === 'road' ? null : BOUNDS[p]);

/** Plan a walk along the roads from where you stand to (x, z), all in local block coordinates. */
function planWalk(s: { place: Place; area: AreaId; cell?: Cell | null; pos: [number, number]; driving?: boolean }, x: number, z: number): [number, number][] | null {
  const c = currentCell(s);
  if (!c) return null;
  const ox = c[0] * CELL_X;
  const oz = c[1] * CELL_Z;
  const from = live.pos ?? s.pos;
  // Cars stay on the roads; on foot you can go into the places
  return route([from[0] + ox, from[1] + oz], [x + ox, z + oz], s.area, s.driving ? () => null : plazaOf).map(([wx, wz]) => [wx - ox, wz - oz]);
}

/** Where your avatar is right now while walking (pos only updates when you reach a waypoint), and which way it faces. */
export const live: { pos: [number, number] | null; rot: number } = { pos: null, rot: 0 };

/** Your car's spot when it is at home: in front of your gate on your street. */
export const HOME_PARK: [number, number] = [-5.6, -1.75];
/** Road distance per world unit, for fuel. */
export const KM_PER_UNIT = 0.1;
/** Pending action meaning "get into the car when you reach it". */
const ENTER_CAR = '__car';

/** Where your parked car is, relative to the block you are in (null when it is not on the grid near you). */
export function carSpot(s: { place: Place; area: AreaId; cell?: Cell | null; parked?: { cell: Cell; pos: [number, number]; rot: number } | null }): { pos: [number, number]; rot: number } | null {
  const here = currentCell(s);
  if (!here) return null;
  const p = s.parked ?? { cell: HOME_CELLS[s.area], pos: HOME_PARK, rot: Math.PI / 2 };
  return { pos: [p.pos[0] + (p.cell[0] - here[0]) * CELL_X, p.pos[1] + (p.cell[1] - here[1]) * CELL_Z], rot: p.rot };
}

export type Pose = 'sit' | 'wave' | 'dance' | 'kneel' | 'phone';
/** Energy per real second while you sit down. */
export const SIT_REST = 0.4;
/** Kneeling to greet a contact near you, once a day. */
export const GREET_REL = 3;
export const GREET_RANGE = 3;
/** Fun per real second while you dance or press phone; dancing costs energy. */
export const DANCE_FUN = 0.5;
export const DANCE_TIRE = 0.2;
export const PHONE_FUN = 0.15;

/** Ride apps and the map treat the road as the place you were last near. */
export const ridePlace = (s: { place: Place; near?: Place }): Place => (s.place === 'road' ? (s.near ?? 'street') : CAMPUS_PLACES.includes(s.place) ? 'uniabuja' : s.place);

/** Chance per idle game hour that something happens. */
const IDLE_EVENT_CHANCE = 0.3;
/** Chance a road trip gets an event halfway. */
const COMMUTE_EVENT_CHANCE = 0.45;

const RUSH_HOURS = [7, 8, 17, 18];
const RUSH_FACTOR = 1.6;

/** Real duration of an activity started at `time`. */
export function durationAt(a: Activity, time: number, area: AreaId = 'kubwa', world?: { weather?: Weather; news?: ActiveNews[] }): number {
  const base = a.homeLeg ? a.minutes * AREAS[area].commute : a.minutes;
  const rush = a.commute && RUSH_HOURS.includes(clockParts(time).hour) ? RUSH_FACTOR : 1;
  const extra = world ? tripFactor(a, world.weather, combinedMods(world.news, clockParts(time).day)) : 1;
  return Math.round(base * rush * extra);
}

/** What an activity costs right now, after today's news. */
export const costAt = (a: Activity, s: { time: number; news?: ActiveNews[]; homeUps?: string[] }) =>
  WIFI_FREE.includes(a.id) && s.homeUps?.includes('wifi') ? 0 : priceOf(a, combinedMods(s.news, clockParts(s.time).day));

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
  stats: {} as Record<string, number>,
  grade: 0,
  gradeShifts: 0,
  businesses: {} as Record<string, OwnedBusiness>,
  car: null as { id: string; condition: number; fuel?: number; paint?: string } | null,
  sick: null as Sickness | null,
  heat: 0,
  flags: {} as Record<string, number>,
  loves: {} as Record<string, Love>,
  homeUps: [] as string[],
  look: DEFAULT_LOOK,
  courses: {} as Partial<Record<CourseId, number>>,
  politics: NO_POLITICS as Politics,
  lastDay: 1,
  epoch: undefined as number | undefined,
  skills: [] as CourseId[],
  fitness: 10,
  gymUntil: 0,
  wardrobe: ['tee'] as Outfit[],
  properties: {} as Partial<Record<AreaId, Property>>,
  adBoostUntil: 0,
  swiped: [] as string[],
  weather: 'sunny' as Weather,
  nextWeatherChange: START_TIME + 240,
  news: [] as ActiveNews[],
  eventTrip: null as string | null,
  hasNet: false,
  goals: [] as string[],
  savings: 0,
  savingsInterest: 0,
  loan: null as { owed: number; dueDay: number } | null,
  followers: 0,
  lastPostAt: -1e9,
  lastBrandDay: -99,
  posts: [] as GramPost[],
  power: true,
  nextPowerChange: START_TIME + 180,
  pos: START_POS,
  target: null,
  route: [] as [number, number][],
  cell: null as Cell | null,
  driving: false,
  pose: null as Pose | null,
  parked: null as { cell: Cell; pos: [number, number]; rot: number } | null,
  pending: null,
  active: null,
  txns: [{ at: START_TIME, label: 'Money wey you carry land Abuja', amount: START_MONEY }],
  toasts: [],
  lowWarned: {},
  menu: null,
  npcMenu: null,
  minigame: null,
  phone: null,
  event: null as string | null,
  eventResult: null as EventResult | null,
  eventHistory: {} as Record<string, number>,
  nextEventCheck: START_TIME + 90,
});

/** Why an activity can't start right now, or null if it can. */
export type BlockState = Pick<GameState, 'time' | 'money' | 'power' | 'active' | 'packaging' | 'pantry' | 'cv' | 'area' | 'rentLocked'> & { unlocks?: string[]; grade?: number; hasCar?: boolean; car?: { id: string; fuel?: number; condition?: number } | null; carId?: string; carFuel?: number; sick?: Sickness | null; contacts?: Record<string, ContactState>; weather?: Weather; news?: ActiveNews[]; homeUps?: string[]; courses?: Partial<Record<CourseId, number>>; skills?: CourseId[]; gymUntil?: number; school?: School };

/** Everything events look at to decide if and how they happen. */
export function eventContext(s: GameState, trip?: string | null): EventContext {
  const { hour, day } = clockParts(s.time);
  return {
    place: s.place,
    hour,
    day,
    money: s.money,
    power: s.power,
    rentOverdue: day > s.rentDueDay && !s.rentLocked,
    met: Object.keys(s.contacts),
    gap: packagingGap(s.packaging, s.money, s.area),
    followers: s.followers,
    loanOverdue: !!s.loan && day > s.loan.dueDay,
    owned: Object.keys(s.businesses),
    grade: s.cv >= 3 ? s.grade : -1,
    carCondition: s.car?.condition,
    trip: trip ?? undefined,
    heat: s.heat ?? 0,
    longLeg: longLeg(s.contacts),
    packaging: s.packaging,
    weather: s.weather ?? 'sunny',
    flags: s.flags ?? {},
    partner: officialPartner(s.loves ?? {}),
    dating: Object.values(s.loves ?? {}).filter((l) => l.interest >= 55 && !l.married).length,
    fakeLife: Object.values(s.loves ?? {}).some((l) => l.fakeLife),
    homeUps: s.homeUps ?? [],
    office: s.politics?.office ?? -1,
    campaigning: !!s.politics?.campaign,
    votesBought: !!s.politics?.votesBought,
    festival: festivalOn(day)?.id,
    landAt: Object.entries(s.properties ?? {}).filter(([, p]) => p && p.status !== 'built').map(([id]) => id),
    area: s.area,
  };
}

/** Changes interest for your official partner, or whoever you dey date most. */
function applyPartnerLove(loves: Record<string, Love>, delta: number): Record<string, Love> {
  const id = officialPartner(loves) ?? Object.entries(loves).sort((a, b) => b[1].interest - a[1].interest)[0]?.[0];
  if (!id) return loves;
  return { ...loves, [id]: { ...loves[id], interest: clamp(loves[id].interest + delta), ...(delta < 0 ? { fakeLife: false } : {}) } };
}

let companionCheck: (() => string | undefined) | null = null;
/** Lets multiplayer tell the game which friend (if any) is in the same place. */
export const setCompanionCheck = (fn: typeof companionCheck) => (companionCheck = fn);

export function blockReason(a: Activity, s: BlockState): string | null {
  if (a.locked) return a.locked;
  if (s.rentLocked && activityPlace(a.id) === 'home' && !a.travelTo) return 'Landlord don lock your door 🔒 Pay rent for phone';
  const waived = s.unlocks?.includes(a.id);
  if (!waived && a.requires?.packaging && s.packaging < a.requires.packaging) return `Need 👔 Packaging ${a.requires.packaging} (you get ${Math.round(s.packaging)})`;
  if (!waived && a.requires?.cv && s.cv < a.requires.cv) return `Dem never call you. Submit CV ${a.requires.cv - s.cv} more time`;
  if (!waived && a.requires?.longLeg && longLeg(s.contacts ?? {}) < a.requires.longLeg) return `Need 🦵 Long Leg ${a.requires.longLeg} (you get ${longLeg(s.contacts ?? {})}). Know bigger people`;
  if (s.active) return 'You dey do something already';
  if (a.hours && !inHours(s.time, a.hours)) {
    return `Only from ${a.hours[0]}:00 to ${a.hours[1]}:00`;
  }
  // UI passes hasCar; the store passes its full state with `car`.
  if (a.requires?.car && !(s.hasCar ?? !!s.car)) return 'You no get car. Buy one for 🚗 Cars app';
  const need = litresFor(a, s.carId ?? s.car?.id);
  const tank = s.carFuel ?? s.car?.fuel ?? START_FUEL;
  if (need > tank) return `Fuel no reach: need ${need.toFixed(1)}L, tank get ${tank.toFixed(1)}L ⛽ Buy fuel for filling station`;
  if (a.effects?.fuel && !(s.hasCar ?? !!s.car)) return 'You no get car to put fuel';
  if (s.sick && (a.pay || a.id === OFFICE_SHIFT_ID)) return `You dey sick (${SICKNESS[s.sick].name}). Treat am first 🤒`;
  if (a.usesPantry && s.pantry < a.usesPantry) return 'No foodstuff. Buy for Wuse Market';
  if (a.requires?.school) {
    const why = schoolBlock(s.school, a.requires.school as SchoolNeed, clockParts(s.time).day);
    if (why) return why;
  }
  if (a.requires?.course && s.courses?.[a.requires.course as CourseId] === undefined) return `Enroll for ${courseById(a.requires.course)?.name ?? 'the course'} first (📚 Learn app)`;
  if (a.requires?.course && s.skills?.includes(a.requires.course as CourseId)) return 'You don finish this course already 🎓';
  if (a.requires?.skill && !s.skills?.includes(a.requires.skill as CourseId)) return `You need ${courseById(a.requires.skill)?.name ?? 'training'} first (📚 Learn app)`;
  if (a.requires?.gym && clockParts(s.time).day > (s.gymUntil ?? 0)) return 'Your gym membership never pay (📚 Learn app)';
  if (a.requires?.mansion && homeTier(s.area) !== 'mansion') return 'Na only mansion get this one';
  if (a.requires?.homeItem && !s.homeUps?.includes(a.requires.homeItem)) return `Buy ${homeItemById(a.requires.homeItem)?.name ?? 'am'} first (🏠 Rent app)`;
  const cost = costAt(a, s) + (a.requiresPower && !s.power ? genCostFor(s.homeUps) : 0);
  if (cost > s.money) return `You need ${formatNaira(cost)}`;
  return null;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      const startActivity = (id: string, bonus?: number) => {
        const s = get();
        const a = activityById(id);
        if (!a) return;
        const reason = blockReason(a, s);
        if (reason) {
          get().toast(`😕 ${reason}`);
          set({ pending: null });
          return;
        }
        if (a.minigame && bonus === undefined) {
          set({ minigame: { id, kind: a.minigame }, pending: null, menu: null, phone: null });
          return;
        }
        const gen = !!a.requiresPower && !s.power;
        const price = costAt(a, s);
        const genFee = gen ? genCostFor(s.homeUps) : 0;
        const cost = price + genFee;
        const txns = [...s.txns];
        if (price) txns.unshift({ at: s.time, label: a.label, amount: -price });
        if (genFee) txns.unshift({ at: s.time, label: 'Fuel for gen', amount: -genFee });
        const total = durationAt(a, s.time, s.area, s);
        const burn = litresFor(a, s.car?.id);
        if (burn && s.car) set({ car: { ...s.car, fuel: Math.max(0, (s.car.fuel ?? START_FUEL) - burn) } });
        const eventAt = a.commute && Math.random() < COMMUTE_EVENT_CHANCE ? total * randomBetween(0.3, 0.7) : undefined;
        set({
          active: { id, remaining: total, gen, total, eventAt, ...(bonus !== undefined ? { bonus } : {}) },
          pending: null,
          money: s.money - cost,
          pantry: s.pantry - (a.usesPantry ?? 0),
          txns: txns.slice(0, 40),
        });
        if (gen) get().toast('⛽ No light, you on gen');
        if (total > a.minutes) get().toast('🚗 Rush hour! Traffic don hold for expressway');
      };

      const bump = (...keys: string[]) => {
        const stats = { ...get().stats };
        for (const k of keys) stats[k] = (stats[k] ?? 0) + 1;
        set({ stats });
      };

      /** Award any goals newly met. */
      const checkGoals = () => {
        const s = get();
        const ctx = { ...s, day: clockParts(s.time).day };
        const fresh = ALL_GOALS.filter((g) => !s.goals.includes(g.id) && g.done(ctx));
        if (!fresh.length) return;
        const reward = fresh.reduce((sum, g) => sum + g.reward, 0);
        set({
          goals: [...s.goals, ...fresh.map((g) => g.id)],
          money: s.money + reward,
          txns: reward ? [{ at: s.time, label: `Goal reward: ${fresh.map((g) => g.title).join(', ')}`, amount: reward }, ...s.txns].slice(0, 40) : s.txns,
        });
        for (const g of fresh) get().toast(`🏆 ${g.title}!${g.reward ? ` +${formatNaira(g.reward)}` : ''}`);
      };

      /** UniAbuja: what finishing a school activity does to your record. */
      const schoolDone = (id: string) => {
        const s = get();
        const sc = s.school ?? NO_SCHOOL;
        if (id === 'jamb') {
          const score = jambScore(s.cv, Math.random);
          const best = Math.max(score, sc.jamb ?? 0);
          set({ school: { ...sc, jamb: best } });
          const can = admissible(best);
          get().toast(`🖥️ JAMB result: ${score}/400. ${can.length ? `You fit enter ${can.length} course(s)! Check 🎓 UniAbuja portal` : 'E no reach any cut-off. Read more, write again 💪🏾'}`);
        } else if (id === 'uni-lecture') {
          set({ school: { ...sc, lectures: sc.lectures + 1 } });
          get().toast(`📝 Lecture ${sc.lectures + 1}/${LECTURES_PER_LEVEL} for ${levelName(sc.level)}`);
        } else if (id === 'library-read' && sc.programme && !sc.finalist) {
          set({ school: { ...sc, study: Math.min(MAX_STUDY, sc.study + 1) } });
        } else if (id === 'uni-exam') {
          const p = programmeById(sc.programme);
          if (!p) return;
          const gp = examGrade(sc, s.fitness ?? 0, Math.random);
          const results = [...sc.results, gp];
          if (gp < PASS_GP) {
            // Carry over: repeat the level, pay fees again
            set({ school: { ...sc, results, lectures: 0, study: 0, feesPaid: false } });
            get().toast(`😭 ${levelName(sc.level)} result: GP ${gp.toFixed(2)}. Carryover! You go repeat the level.`);
          } else if (sc.level >= p.years) {
            set({ school: { ...sc, results, lectures: 0, study: 0, finalist: true } });
            get().toast(`🎉 Final exams passed! CGPA ${cgpaOf(results).toFixed(2)}. Go UniAbuja for convocation 🎓`);
          } else {
            set({ school: { ...sc, results, level: sc.level + 1, lectures: 0, study: 0, feesPaid: false } });
            get().toast(`✅ ${levelName(sc.level)} result: GP ${gp.toFixed(2)}. You don enter ${levelName(sc.level + 1)}! Pay new session fees.`);
          }
        } else if (id === 'convocation') {
          const p = programmeById(sc.programme);
          if (!p) return;
          const cgpa = cgpaOf(sc.results);
          const cls = degreeClass(cgpa);
          set({
            school: { ...sc, finalist: false, graduated: { programme: p.id, cgpa } },
            skills: s.skills.includes('degree') ? s.skills : [...s.skills, 'degree'],
            packaging: clamp(s.packaging + p.packaging),
            cv: s.cv + 10,
          });
          get().toast(`🎓 Congrats graduate! ${p.name}, ${cls.name} (${cgpa.toFixed(2)}). Check 💼 Jobs: ${p.job.label}`);
        }
      };

      const finish = (a: Activity) => {
        const s = get();
        const fx = a.effects;
        const keys: string[] = [];
        if ((a.gains.food ?? 0) > 0) keys.push('meals');
        // Classes: count them, graduate at the end
        if (a.requires?.course) {
          const cid = a.requires.course as CourseId;
          const c = courseById(cid);
          const done = (s.courses?.[cid] ?? 0) + 1;
          if (c && done >= c.classes) {
            set({ courses: { ...s.courses, [cid]: done }, skills: [...(s.skills ?? []), cid], packaging: clamp(s.packaging + (cid === 'degree' ? 10 : 3)) });
            get().toast(`🎓 You don graduate: ${c.name}! New: ${c.unlocks}`);
          } else if (c) {
            set({ courses: { ...s.courses, [cid]: done } });
            get().toast(`${c.emoji} Class ${done}/${c.classes} done`);
          }
        }
        if (fx?.fitness) set({ fitness: Math.min(100, (get().fitness ?? 0) + fx.fitness) });
        schoolDone(a.id);
        // Doing things with a real friend nearby feels better
        const buddy = !a.travelTo && !a.away ? companionCheck?.() : undefined;
        if (buddy) {
          set({ needs: { ...get().needs, social: clamp(get().needs.social + 10), fun: clamp(get().needs.fun + 6) } });
          get().toast(`👯 You and ${buddy} dey together! +10 💬 +6 🎉`);
        }
        // House upgrades: better sleep and better TV
        const ups = s.homeUps ?? [];
        if (a.sleep && a.minutes >= 480 && (ups.includes('mattress') || ups.includes('ac'))) {
          const fun = (ups.includes('mattress') ? 8 : 0) + (ups.includes('ac') ? 12 : 0);
          set({ needs: { ...get().needs, fun: clamp(get().needs.fun + fun), hygiene: clamp(get().needs.hygiene + (ups.includes('ac') ? 5 : 0)) } });
          get().toast(`😌 You sleep like baby${ups.includes('ac') ? ' for AC' : ' for your new mattress'}. +${fun} 🎉`);
        }
        if (TV_ACTIVITIES.includes(a.id)) {
          const fun = (ups.includes('smarttv') ? 10 : 0) + (ups.includes('sofa') ? 5 : 0);
          if (fun) set({ needs: { ...get().needs, fun: clamp(get().needs.fun + fun) } });
        }
        if (a.pay) keys.push('jobs');
        if (a.travelTo) keys.push(`visit-${a.travelTo}`);
        if (a.commute || a.id.startsWith('trek-')) keys.push('trips');
        if (a.id.startsWith('trek-')) keys.push('treks');
        if (a.sleep && a.minutes >= 480) keys.push('sleeps');
        if (a.id === 'bottle') keys.push('bottles');
        if (a.requires?.car && s.car) {
          keys.push('drives');
          const wear = a.id === 'hailing' ? 8 : 2 + Math.round(Math.random() * 4);
          set({ car: { ...s.car, condition: Math.max(0, s.car.condition - wear) } });
        }
        bump(...keys);
        const car = get().car;
        if (fx?.carFix && car) {
          set({ car: { ...car, condition: Math.min(100, car.condition + fx.carFix) } });
          get().toast(`🔧 Car condition +${fx.carFix}`);
        }
        const tankCar = get().car;
        if (fx?.fuel && tankCar) {
          const fuel = Math.min(TANK, (tankCar.fuel ?? START_FUEL) + fx.fuel);
          const bad = !!fx.badFuel && Math.random() < fx.badFuel;
          set({ car: { ...tankCar, fuel, condition: bad ? Math.max(0, tankCar.condition - 20) : tankCar.condition } });
          get().toast(bad ? '⛽😩 Na adulterated fuel! Engine dey knock. Car condition -20' : `⛽ Tank: ${fuel.toFixed(0)}L / ${TANK}L`);
        }
        if (fx?.meet) meetContact(fx.meet);
        if (fx?.net && !s.hasNet) {
          set({ hasNet: true });
          get().toast('🦟 Mosquito net don hang. Malaria go reduce');
        }
        if (fx?.cure && s.sick && (fx.cure === true || fx.cure.includes(s.sick))) {
          set({ sick: null });
          bump('cured');
          get().toast(`💪 ${SICKNESS[s.sick].name} don clear! You don dey kampe`);
        } else if (fx?.cure && s.sick) {
          get().toast(`😕 That drug no be for ${SICKNESS[s.sick].name}`);
        }
        if (fx) {
          set({
            packaging: Math.min(100, s.packaging + (fx.packaging ?? 0)),
            pantry: s.pantry + (fx.pantry ? fx.pantry + (s.homeUps?.includes('fridge') ? 1 : 0) : 0),
            cv: s.cv + (fx.cv ? fx.cv + (combinedMods(s.news, clockParts(s.time).day).cvBonus ?? 0) : 0),
          });
          if (fx.packaging) get().toast(`👔 Packaging +${fx.packaging}. You don dey look clean!`);
          if (fx.pantry) get().toast(`🧺 Foodstuff +${fx.pantry} meals. Cook am for house`);
          if (fx.cv) {
            const cv = get().cv;
            get().toast(cv >= 3 ? '📞 Dem don call you! Contract staff job don open for Secretariat' : `📄 Dem collect am. "Come back next week" 😑 (${cv}/3)`);
          }
        }
        const bonus = s.active?.bonus;
        let pay = payFor(a, s.grade);
        if (pay && a.id.startsWith('grad-')) pay = gradPay(pay, s.school);
        if (bonus !== undefined && a.minigame) {
          if (pay) pay = Math.round(pay * (0.7 + 0.6 * bonus));
          const n = get().needs;
          if (a.minigame === 'cook') set({ needs: { ...n, food: clamp(n.food + Math.round(30 * (bonus - 0.5))), fun: clamp(n.fun + Math.round(10 * bonus)) } });
          if (a.minigame === 'timing' && !pay) set({ needs: { ...n, fun: clamp(n.fun + Math.round(30 * bonus - 10)), social: clamp(n.social + Math.round(10 * bonus)) } });
          if (a.minigame === 'drive' && bonus !== 0.5 && get().car) {
            const car = get().car!;
            const wear = driveWear(bonus);
            set({ car: { ...car, condition: Math.max(0, Math.min(100, car.condition - wear)) } });
            get().toast(wear > 0 ? `🚗💥 Rough driving: car condition -${wear}` : '🚗✨ Smooth driving! Car no suffer');
          }
          if (a.minigame === 'predict' && bonus !== 0.5) {
            set({ needs: { ...n, fun: clamp(n.fun + (bonus >= 1 ? 20 : -5)), social: clamp(n.social + (bonus >= 1 ? 10 : 0)) } });
            get().toast(bonus >= 1 ? '🎯 Your prediction correct! Everybody dey hail you 🙌🏾' : '😅 Your prediction no enter. Next match!');
          }
        }
        if (a.id === OFFICE_SHIFT_ID) set({ gradeShifts: s.gradeShifts + 1 });
        if (pay) {
          const label = a.id === OFFICE_SHIFT_ID ? `Salary: ${GRADES[s.grade].title}` : a.label;
          set({
            money: get().money + pay,
            txns: [{ at: s.time, label, amount: pay }, ...get().txns].slice(0, 40),
          });
          get().toast(`💰 You don collect ${formatNaira(pay)}`);
        } else if (!a.travelTo) {
          if (!fx) get().toast(`${a.emoji} Done: ${a.label}`);
        }
        set({ active: null, ...(a.away ? { pos: exitSpot(s.place, s.area) } : {}) });
        if (a.travelTo) {
          set({ place: a.travelTo, pos: entrySpot(a.travelTo, s.area), target: null, route: [], cell: null, driving: false });
          // You drove there: your car is parked by the entrance
          if (a.id.startsWith('drive-')) {
            const c = cellOfPlace(a.travelTo, s.area);
            const e = entrySpot(a.travelTo, s.area);
            set({ parked: a.travelTo === 'street' || a.travelTo === 'home' || !c ? null : { cell: c, pos: [e[0] + 1.6, e[1] + 1.4], rot: 0 } });
          }
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
        const e = pickEvent(EVENTS, trigger, eventContext(s, trip), s.eventHistory, s.time);
        if (e) set({ event: e.id, eventTrip: trip ?? null, eventHistory: { ...s.eventHistory, [e.id]: s.time }, menu: null, phone: null });
      };

      return {
        ...initial(),

        answerEvent: (index) => {
          const s = get();
          const e = EVENTS.find((x) => x.id === s.event);
          const choice = e?.choices[index];
          if (!e || !choice) return set({ event: null });
          if (choice.when && !choice.when(eventContext(s, s.eventTrip))) return;
          const cost = choice.cost ?? 0;
          if (cost > s.money) return;
          const fx = resolveChoice(choice, Math.random, eventContext(s, s.eventTrip));
          const effect = fx.effect ?? {};
          const moneyDelta = (effect.money ?? 0) - cost;
          let needs = { ...s.needs };
          for (const [k, v] of Object.entries(effect.needs ?? {})) needs[k as NeedKey] = clamp(needs[k as NeedKey] + (v ?? 0));
          const lost = effect.minutes ?? 0;
          if (lost) needs = tickNeeds(needs, lost);
          set({
            event: null,
            eventTrip: null,
            heat: clamp((s.heat ?? 0) + (effect.heat ?? 0)),
            loves: effect.partnerLove ? applyPartnerLove(s.loves ?? {}, effect.partnerLove) : s.loves,
            politics: effect.support && s.politics?.campaign ? { ...s.politics, campaign: { ...s.politics.campaign, support: Math.max(0, Math.min(95, s.politics.campaign.support + effect.support)) } } : s.politics,
            flags: effect.flag ? { ...(s.flags ?? {}), ...Object.fromEntries([effect.flag].flat().map((f) => [f, clockParts(s.time).day])) } : s.flags,
            money: s.money + moneyDelta,
            needs,
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
          const relAll = effect.relAll ? Object.fromEntries(Object.keys(get().contacts).map((id) => [id, effect.relAll!])) : {};
          const extra = [...(effect.meet ? [meetContact(effect.meet)] : []), ...changeRel({ ...relAll, ...(effect.rel ?? {}) })].filter((c): c is string => !!c);
          if (effect.payLoan) get().repayLoan();
          const myCar = get().car;
          if (effect.carRepair && myCar) set({ car: { ...myCar, condition: 100 } });
          if (effect.fuel && get().car) set({ car: { ...get().car!, fuel: Math.min(TANK, (get().car!.fuel ?? START_FUEL) + effect.fuel) } });
          const carNow = get().car;
          if (effect.carWear && carNow) set({ car: { ...carNow, condition: Math.max(0, carNow.condition - effect.carWear) } });
          const cb = effect.closeBusiness;
          if (cb && get().businesses[cb.id]) {
            const biz = get().businesses;
            set({ businesses: { ...biz, [cb.id]: { ...biz[cb.id], closedUntil: clockParts(s.time).day + cb.days } } });
          }
          const res = get().eventResult;
          if (extra.length && res) set({ eventResult: { ...res, chips: [...res.chips, ...extra] } });
        },

        closeEvent: () => set({ eventResult: null }),

        buyCar: (id, paint) => {
          const s = get();
          const c = carById(id);
          if (!c || s.car?.id === id) return;
          if (s.active) return get().toast('😕 Finish wetin you dey do first');
          const old = s.car ? carById(s.car.id) : undefined;
          const tradeIn = old ? Math.round(old.price * RESALE) : 0;
          const cost = c.price - tradeIn;
          if (cost > s.money) return get().toast(`😕 You need ${formatNaira(cost)}${old ? ' (after trade-in)' : ''}`);
          set({
            money: s.money - cost,
            car: { id, condition: 100, fuel: s.car?.fuel ?? START_FUEL, paint: paint ?? c.color },
            packaging: clamp(s.packaging + c.packaging - (old?.packaging ?? 0)),
            txns: [{ at: s.time, label: `Bought ${c.name}${old ? ` (traded in ${old.name})` : ''}`, amount: -cost }, ...s.txns].slice(0, 40),
          });
          get().toast(`${c.emoji} You don buy ${c.name}! 👔 +${c.packaging - (old?.packaging ?? 0)}`);
        },

        resprayCar: (paint) => {
          const s = get();
          if (!s.car || s.car.paint === paint) return;
          if (s.money < RESPRAY_COST) return get().toast(`😕 Respray na ${formatNaira(RESPRAY_COST)}`);
          set({ money: s.money - RESPRAY_COST, car: { ...s.car, paint }, txns: [{ at: s.time, label: 'Car respray', amount: -RESPRAY_COST }, ...s.txns].slice(0, 40) });
          get().toast('🎨 Your car don get new paint! E dey shine 😎');
        },

        sellCar: () => {
          const s = get();
          const c = s.car ? carById(s.car.id) : undefined;
          if (!c || !s.car) return;
          if (s.active) return get().toast('😕 Finish wetin you dey do first');
          const got = Math.round(c.price * RESALE * (0.5 + s.car.condition / 200));
          set({
            money: s.money + got,
            car: null,
            packaging: clamp(s.packaging - c.packaging),
            txns: [{ at: s.time, label: `Sold ${c.name}`, amount: got }, ...s.txns].slice(0, 40),
          });
          get().toast(`🤝 You don sell ${c.name} for ${formatNaira(got)}`);
        },

        repairCar: () => {
          const s = get();
          if (!s.car) return;
          const cost = Math.round(repairCost(s.car.condition) * (s.skills?.includes('mechanic') ? 0.5 : 1));
          if (cost <= 0) return get().toast('🔧 Car dey perfect already');
          if (cost > s.money) return get().toast(`😕 Mechanic want ${formatNaira(cost)}`);
          set({
            money: s.money - cost,
            car: { ...s.car, condition: 100 },
            txns: [{ at: s.time, label: 'Mechanic: car service', amount: -cost }, ...s.txns].slice(0, 40),
          });
          get().toast('🔧 Car don service. E dey run like new');
        },

        promote: () => {
          const s = get();
          const reason = promotionBlock(s.grade, s.gradeShifts, longLeg(s.contacts), s.packaging);
          if (s.cv < 3) return get().toast('😕 You never get government work. Submit CV for Secretariat');
          if (reason) return get().toast(`😕 ${reason}`);
          const next = GRADES[s.grade + 1];
          set({
            grade: s.grade + 1,
            gradeShifts: 0,
            packaging: clamp(s.packaging + 5),
            phone: null,
            eventResult: {
              emoji: '🎉',
              title: 'Promotion letter don land!',
              text: `Congratulations! You don become ${next.title}. Your office shift now pay ${formatNaira(next.pay)}. Office people don dey call you "Oga" 😎`,
              chips: [`💼 ${next.title}`, `+${formatNaira(next.pay - GRADES[s.grade].pay)}/shift`, '+5 👔'],
            },
          });
        },

        buyBusiness: (id) => {
          const s = get();
          const b = businessById(id);
          if (!b || s.businesses[id]) return;
          if (b.requires?.longLeg && longLeg(s.contacts) < b.requires.longLeg) return get().toast(`😕 You need 🦵 Long Leg ${b.requires.longLeg} for this one`);
          if (b.requires?.packaging && s.packaging < b.requires.packaging) return get().toast(`😕 You need 👔 Packaging ${b.requires.packaging}`);
          if (s.money < b.cost) return get().toast(`😕 You need ${formatNaira(b.cost)}`);
          set({
            money: s.money - b.cost,
            businesses: { ...s.businesses, [id]: { level: 1 } },
            txns: [{ at: s.time, label: `Started ${b.name}`, amount: -b.cost }, ...s.txns].slice(0, 40),
          });
          get().toast(`${b.emoji} ${b.name} don open! Money go start to enter every morning`);
        },

        upgradeBusiness: (id) => {
          const s = get();
          const b = businessById(id);
          const owned = s.businesses[id];
          if (!b || !owned) return;
          if (owned.level >= MAX_BIZ_LEVEL) return get().toast('😕 E don reach the top level');
          const cost = upgradeCost(b, owned.level);
          if (s.money < cost) return get().toast(`😕 You need ${formatNaira(cost)}`);
          set({
            money: s.money - cost,
            businesses: { ...s.businesses, [id]: { ...owned, level: owned.level + 1 } },
            txns: [{ at: s.time, label: `Expanded ${b.name}`, amount: -cost }, ...s.txns].slice(0, 40),
          });
          get().toast(`📈 ${b.name} don grow to level ${owned.level + 1}!`);
        },

        setStaff: (id, delta) => {
          const s = get();
          const b = businessById(id);
          const owned = s.businesses[id];
          if (!b || !owned) return;
          const staff = Math.max(0, Math.min(MAX_STAFF[b.tier], (owned.staff ?? 0) + delta));
          if (staff === (owned.staff ?? 0)) return;
          set({ businesses: { ...s.businesses, [id]: { ...owned, staff } } });
          get().toast(delta > 0 ? `🧑🏾‍🍳 You don hire one more worker for ${b.name} (${formatNaira(wageOf(b))}/day)` : `👋🏾 You don sack one worker for ${b.name}`);
        },

        payForAd: (cost, label, until) => {
          const s = get();
          set({
            money: s.money - cost,
            adBoostUntil: Math.max(s.adBoostUntil ?? 0, until),
            packaging: clamp(s.packaging + 2),
            txns: cost ? [{ at: s.time, label, amount: -cost }, ...s.txns].slice(0, 40) : s.txns,
          });
          get().toast(`📢 Your ad don go up! Everybody for Abuja go see am${Object.keys(s.businesses).length ? '. Business +10% while e dey' : ''}`);
        },

        buyHomeItem: (id) => {
          const s = get();
          const item = homeItemById(id);
          if (!item || s.homeUps?.includes(id)) return;
          if (!areaAllows(s.area, item)) return get().toast('🏠 Your house too small for this one. Move go better area first');
          if (s.money < item.cost) return get().toast(`😕 You need ${formatNaira(item.cost)}`);
          set({
            money: s.money - item.cost,
            homeUps: [...(s.homeUps ?? []), id],
            packaging: clamp(s.packaging + item.packaging),
            txns: [{ at: s.time, label: `Bought ${item.name}`, amount: -item.cost }, ...s.txns].slice(0, 40),
          });
          get().toast(`${item.emoji} ${item.name} don land your house! 👔 +${item.packaging}`);
        },

        saveMoney: (amount) => {
          const s = get();
          if (amount <= 0 || amount > s.money) return get().toast('😕 You no get that much for main balance');
          set({
            money: s.money - amount,
            savings: s.savings + amount,
            txns: [{ at: s.time, label: 'Moved to Ego Save', amount: -amount }, ...s.txns].slice(0, 40),
          });
          get().toast(`💜 ${formatNaira(amount)} don enter Ego Save. E go dey grow small small`);
        },

        withdrawSavings: (amount) => {
          const s = get();
          const n = Math.min(amount, s.savings);
          if (n <= 0) return get().toast('😕 Ego Save empty');
          set({
            money: s.money + n,
            savings: s.savings - n,
            txns: [{ at: s.time, label: 'From Ego Save', amount: n }, ...s.txns].slice(0, 40),
          });
          get().toast(`💜 ${formatNaira(n)} don land your main balance`);
        },

        takeLoan: (amount) => {
          const s = get();
          const { day } = clockParts(s.time);
          if (s.loan) return get().toast('😕 Pay your old loan first');
          if (amount <= 0 || amount > LOAN_MAX) return get().toast(`😕 Max loan na ${formatNaira(LOAN_MAX)}`);
          const owed = Math.round(amount * (1 + LOAN_FEE));
          set({
            money: s.money + amount,
            loan: { owed, dueDay: day + LOAN_DAYS },
            txns: [{ at: s.time, label: 'Ego Loan', amount }, ...s.txns].slice(0, 40),
          });
          get().toast(`💜 Loan approved! Pay ${formatNaira(owed)} before Day ${day + LOAN_DAYS}`);
        },

        repayLoan: () => {
          const s = get();
          if (!s.loan) return;
          if (s.loan.owed > s.money) return get().toast(`😕 You need ${formatNaira(s.loan.owed)} to clear the loan`);
          set({
            money: s.money - s.loan.owed,
            loan: null,
            txns: [{ at: s.time, label: 'Ego Loan repayment', amount: -s.loan.owed }, ...s.txns].slice(0, 40),
          });
          get().toast('✅ Loan cleared. Your name don comot for their list');
        },

        adjustMoney: (delta, label) => {
          const s = get();
          set({ money: s.money + delta, txns: [{ at: s.time, label, amount: delta }, ...s.txns].slice(0, 40) });
        },

        giftLove: (id) => {
          const s = get();
          const l = s.loves?.[id];
          const m = matchById(id);
          if (!l || !m) return;
          const { day } = clockParts(s.time);
          if (l.lastGiftDay !== undefined && day - l.lastGiftDay < 2) return get().toast('🎁 You just give gift. No spoil am 😅');
          if (s.money < LOVE_GIFT_COST) return get().toast(`😕 Gift na ${formatNaira(LOVE_GIFT_COST)}`);
          set({
            money: s.money - LOVE_GIFT_COST,
            loves: { ...s.loves, [id]: { ...l, interest: clamp(l.interest + 8), lastGiftDay: day } },
            txns: [{ at: s.time, label: `Gift for ${m.name}`, amount: -LOVE_GIFT_COST }, ...s.txns].slice(0, 40),
          });
          get().toast(`🎁 ${m.name} love the flowers & perfume! 💕 +8`);
        },

        sendMoney: (to, amount) => {
          const s = get();
          if (amount <= 0 || amount > s.money) return get().toast('😕 Insufficient funds');
          const contact = contactById(to);
          if (to !== 'mama' && (!contact || !s.contacts[to])) return;
          const name = to === 'mama' ? 'Mama' : contact!.name;
          const boost = Math.min(25, Math.round((amount / 1000) * 2));
          set({
            money: s.money - amount,
            txns: [{ at: s.time, label: `Transfer to ${name}`, amount: -amount }, ...s.txns].slice(0, 40),
            ...(to === 'mama'
              ? { needs: { ...s.needs, social: clamp(s.needs.social + boost), fun: clamp(s.needs.fun + 5) } }
              : { contacts: { ...s.contacts, [to]: { ...s.contacts[to], rel: clamp(s.contacts[to].rel + boost) } } }),
          });
          get().toast(to === 'mama' ? `🙏 Mama: "God go bless you, my pikin!" 💬 +${boost}` : `💸 ${name} receive am. 🦵 +${boost}`);
        },

        buyToken: () => {
          const s = get();
          if (s.money < TOKEN_COST) return get().toast(`😕 You need ${formatNaira(TOKEN_COST)}`);
          set({
            money: s.money - TOKEN_COST,
            power: true,
            nextPowerChange: s.time + 24 * 60,
            txns: [{ at: s.time, label: 'AEDC prepaid token', amount: -TOKEN_COST }, ...s.txns].slice(0, 40),
          });
          get().toast('💡 Token loaded! Light go stand for 24 hours');
        },

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

        openNpc: (id) => set({ npcMenu: id, menu: null }),

        playMinigame: (score) => {
          const mg = get().minigame;
          set({ minigame: null });
          if (mg) startActivity(mg.id, score === null ? 0.5 : Math.max(0, Math.min(1, score)));
        },

        swipe: (id, like) => {
          const s = get();
          const m = matchById(id);
          if (!m || s.swiped?.includes(id)) return;
          const swiped = [...(s.swiped ?? []), id];
          if (!like) return set({ swiped });
          if (Math.random() < matchChance(s.packaging, m.standard)) {
            set({ swiped, loves: { ...(s.loves ?? {}), [id]: { interest: 12 } } });
            get().toast(`💕 Na match! ${m.name} like you back`);
          } else {
            set({ swiped });
            get().toast(`💔 ${m.name} no like you back.${s.packaging < m.standard ? ' Your packaging never reach 👔' : ''}`);
          }
        },

        textLove: (id) => {
          const s = get();
          const l = s.loves?.[id];
          const m = matchById(id);
          if (!l || !m) return;
          const { day } = clockParts(s.time);
          if (l.lastTextDay === day) return get().toast(`💬 You don text ${m.name} today. No do too much 😅`);
          if (s.money < CALL_COST) return get().toast('😕 You no get data money');
          set({
            money: s.money - CALL_COST,
            needs: { ...s.needs, social: clamp(s.needs.social + 6) },
            loves: { ...s.loves, [id]: { ...l, interest: clamp(l.interest + TEXT_INTEREST), lastTextDay: day } },
          });
          get().toast(`💬 You and ${m.name} gist till phone hot. 💕 +${TEXT_INTEREST}`);
        },

        dateLove: (id, tierId) => {
          const s = get();
          const l = s.loves?.[id];
          const m = matchById(id);
          const tier = DATE_TIERS.find((t) => t.id === tierId);
          if (!l || !m || !tier) return;
          if (s.active) return get().toast('😕 Finish wetin you dey do first');
          const { day } = clockParts(s.time);
          if (l.lastDateDay === day) return get().toast('📅 One date per day abeg');
          if (l.interest < 25) return get().toast(`💬 Gist with ${m.name} small first before you ask am out`);
          if (s.money < tier.cost) return get().toast(`😕 You need ${formatNaira(tier.cost)}`);
          const gain = dateInterest(m.taste, tier.id);
          const fake = (tier.id === 'fakelife' || tier.id === 'bigboy') && packagingGap(s.packaging, s.money - tier.cost, s.area) > 30;
          set({
            money: s.money - tier.cost,
            needs: { ...tickNeeds(s.needs, tier.minutes), fun: clamp(s.needs.fun + 25), social: clamp(s.needs.social + 25), food: clamp(s.needs.food + 30) },
            packaging: clamp(s.packaging + (tier.id === 'bigboy' || tier.id === 'fakelife' ? 1 : 0)),
            loves: { ...s.loves, [id]: { ...l, interest: clamp(l.interest + gain), lastDateDay: day, fakeLife: l.fakeLife || fake } },
            txns: [{ at: s.time, label: `Date with ${m.name}: ${tier.label}`, amount: -tier.cost }, ...s.txns].slice(0, 40),
          });
          get().toast(gain >= 14 ? `${tier.emoji} ${m.name} enjoy am die! 💕 +${gain}` : gain > 0 ? `${tier.emoji} The date dey okay. 💕 +${gain}` : `${tier.emoji} ${m.name} face no happy… 💔 ${gain}`);
        },

        askOut: (id) => {
          const s = get();
          const l = s.loves?.[id];
          const m = matchById(id);
          if (!l || !m || l.official) return;
          const other = officialPartner(s.loves);
          if (other) return get().toast(`😬 You don get ${matchById(other)?.name}. One love at a time!`);
          if (l.interest < ASK_OUT_AT) {
            set({ loves: { ...s.loves, [id]: { ...l, interest: clamp(l.interest - 10) } } });
            return get().toast(`🙈 ${m.name}: "Hmm… make we still dey know each other." 💔 -10`);
          }
          set({ loves: { ...s.loves, [id]: { ...l, official: true, sinceDay: clockParts(s.time).day, interest: clamp(l.interest + 5) } } });
          get().toast(`❤️ ${m.name} say YES! Una don dey official`);
        },

        propose: (id) => {
          const s = get();
          const l = s.loves?.[id];
          const m = matchById(id);
          if (!l?.official || !m || l.engaged) return;
          const { day } = clockParts(s.time);
          if (day - (l.sinceDay ?? day) < PROPOSE_AFTER_DAYS) return get().toast(`⏳ Una never date reach ${PROPOSE_AFTER_DAYS} days. Calm down 😅`);
          if (s.money < RING_COST) return get().toast(`💍 Ring na ${formatNaira(RING_COST)}`);
          if (l.interest < 85) {
            set({ money: s.money - RING_COST, loves: { ...s.loves, [id]: { ...l, interest: clamp(l.interest - 15) } }, txns: [{ at: s.time, label: 'Engagement ring (refused 💔)', amount: -RING_COST }, ...s.txns].slice(0, 40) });
            return get().toast(`💔 ${m.name}: "I no ready…" Ring don waste 😭`);
          }
          set({ money: s.money - RING_COST, loves: { ...s.loves, [id]: { ...l, engaged: true } }, txns: [{ at: s.time, label: 'Engagement ring 💍', amount: -RING_COST }, ...s.txns].slice(0, 40) });
          get().toast(`💍 ${m.name} cry, say YES! Una go meet family for introduction`);
        },

        wed: (id) => {
          const s = get();
          const l = s.loves?.[id];
          const m = matchById(id);
          if (!l?.engaged || !m || l.married) return;
          if (s.money < WEDDING_COST) return get().toast(`💒 Wedding (aso-ebi, hall, jollof) na ${formatNaira(WEDDING_COST)}`);
          set({
            money: s.money - WEDDING_COST,
            packaging: clamp(s.packaging + WEDDING_PACKAGING),
            loves: { ...s.loves, [id]: { ...l, married: true, interest: 100 } },
            txns: [{ at: s.time, label: `Wedding with ${m.name} 💒`, amount: -WEDDING_COST }, ...s.txns].slice(0, 40),
          });
          get().toast(`💒 Happy married life! You and ${m.name} don do am 🎉 👔 +${WEDDING_PACKAGING}`);
        },

        breakUp: (id) => {
          const s = get();
          const m = matchById(id);
          const loves = { ...s.loves };
          delete loves[id];
          set({ loves, needs: { ...s.needs, fun: clamp(s.needs.fun - 20) } });
          get().toast(`💔 You and ${m?.name} don separate`);
        },

        introduce: (id) => {
          if (get().contacts[id]) return;
          meetContact(id);
          const { day } = clockParts(get().time);
          const cs = get().contacts[id];
          if (cs) set({ contacts: { ...get().contacts, [id]: { ...cs, lastTalkDay: day } } });
        },

        talkTo: (id) => {
          const s = get();
          const c = contactById(id);
          const cs = s.contacts[id];
          if (!c || !cs || s.active) return;
          const { day } = clockParts(s.time);
          if (cs.lastTalkDay === day) return get().toast(`🗣️ You and ${c.name} don gist today already`);
          set({
            needs: { ...tickNeeds(s.needs, TALK_MINUTES), social: clamp(s.needs.social + 12) },
            contacts: { ...s.contacts, [id]: { ...cs, rel: clamp(cs.rel + TALK_REL), lastTalkDay: day } },
          });
          get().toast(`🗣️ You and ${c.name} gist face to face. 🦵 +${TALK_REL}`);
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
          bump('rentPaid');
        },

        buyProperty: (area) => {
          const s = get();
          const own = AREAS[area].own;
          const { day } = clockParts(s.time);
          if (!own || s.properties?.[area]) return;
          const price = own.land ?? own.price ?? 0;
          if (s.money < price) return get().toast(`😕 You need ${formatNaira(price)}`);
          set({
            money: s.money - price,
            properties: { ...s.properties, [area]: { status: own.land ? 'land' : 'built', boughtDay: day, spent: price } },
            packaging: clamp(s.packaging + (own.land ? 3 : 10)),
            txns: [{ at: s.time, label: own.land ? `Land for ${AREAS[area].name}` : `Bought ${AREAS[area].home}`, amount: -price }, ...s.txns].slice(0, 40),
          });
          get().toast(own.land ? `📜 You don buy land for ${AREAS[area].name}! C of O dey your hand. Next: build` : `🔑 ${AREAS[area].home} na your own now! 🎉`);
        },

        buildHouse: (area) => {
          const s = get();
          const own = AREAS[area].own;
          const p = s.properties?.[area];
          const { day } = clockParts(s.time);
          if (!own?.build || p?.status !== 'land') return;
          if (s.money < own.build) return get().toast(`😕 Building cost ${formatNaira(own.build)}`);
          set({
            money: s.money - own.build,
            properties: { ...s.properties, [area]: { ...p, status: 'building', readyDay: day + (own.buildDays ?? 10), spent: p.spent + own.build } },
            txns: [{ at: s.time, label: `Building house, ${AREAS[area].name}`, amount: -own.build }, ...s.txns].slice(0, 40),
          });
          get().toast(`🏗️ Bricklayers don start work! House go ready Day ${day + (own.buildDays ?? 10)}`);
        },

        toggleRentOut: (area) => {
          const s = get();
          const p = s.properties?.[area];
          if (p?.status !== 'built') return;
          if (s.area === area && !p.rentedOut) return get().toast('😅 You dey live there. Move out first before you rent am out');
          set({ properties: { ...s.properties, [area]: { ...p, rentedOut: !p.rentedOut } } });
          get().toast(p.rentedOut ? `🏠 Tenant don pack comot from ${AREAS[area].name}` : `💰 Tenant don pack enter! ${formatNaira(AREAS[area].own!.rentOut)} go dey land every morning`);
        },

        sellProperty: (area) => {
          const s = get();
          const p = s.properties?.[area];
          if (!p) return;
          if (s.area === area) return get().toast('😅 You dey live there. Move out first');
          if (p.status === 'building') return get().toast('🏗️ Wait make building finish first');
          const got = Math.round(propertyValue(p, clockParts(s.time).day) * (1 - PROPERTY_SELL_FEE));
          const properties = { ...s.properties };
          delete properties[area];
          set({
            money: s.money + got,
            properties,
            packaging: clamp(s.packaging - (p.status === 'land' ? 3 : 10)),
            txns: [{ at: s.time, label: `Sold property, ${AREAS[area].name}`, amount: got }, ...s.txns].slice(0, 40),
          });
          get().toast(`🤝 You don sell am for ${formatNaira(got)}`);
        },

        moveTo: (to) => {
          const s = get();
          const { day } = clockParts(s.time);
          if (to === s.area) return;
          if (s.active) return get().toast('😕 Finish wetin you dey do first');
          const ownP = s.properties?.[to];
          if (AREAS[to].own && ownP?.status !== 'built') return get().toast('🏗️ Your house never ready');
          if (s.rentLocked || day > s.rentDueDay) return get().toast('😕 Clear your rent first. Landlord no go release your load');
          const cost = moveCost(to);
          if (cost > s.money) return get().toast(`😕 You need ${formatNaira(cost)} to move`);
          set({
            money: s.money - cost,
            area: to,
            // Your own house: no rent again
            rentDueDay: AREAS[to].own ? day + 100000 : day + RENT_CYCLE_DAYS * 2,
            ...(AREAS[to].own && ownP ? { properties: { ...s.properties, [to]: { ...ownP, rentedOut: false } } } : {}),
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

        start: (name, shirt, look, birth) => {
          const epoch = watMidnight(clock());
          const base = { ...initial(), started: true, name: name.trim() || 'Abuja Hustler', shirt, look: look ?? DEFAULT_LOOK, epoch, time: realMinutes(epoch, clock()) };
          base.nextWeatherChange = base.time + 240;
          if (!birth) return set(base);
          const fam = familyById(birth.family);
          const edu = EDUCATIONS.find((e) => e.id === birth.education);
          const home = ORIGINS.find((o) => o.id === birth.origin)?.outfit;
          set({
            ...base,
            birth,
            money: fam.money,
            area: birth.area,
            rentDueDay: 1 + RENT_CYCLE_DAYS * fam.rentPaidCycles,
            packaging: base.packaging + fam.packaging,
            cv: edu?.cv ?? 0,
            fitness: Math.max(0, base.fitness + (edu?.fitness ?? 0)),
            wardrobe: home && home !== 'tee' ? ['tee', home] : ['tee'],
            car: fam.car ? { id: fam.car, condition: 100, fuel: START_FUEL } : null,
          });
        },

        declare: (target) => {
          const s = get();
          const p = s.politics ?? NO_POLITICS;
          const reason = canRun(target, p, { longLeg: longLeg(s.contacts), packaging: s.packaging, money: s.money });
          if (reason) return get().toast(`😕 ${reason}`);
          const o = OFFICES[target];
          const { day } = clockParts(s.time);
          set({ money: s.money - o.form, txns: [{ at: s.time, label: o.appointed ? `Lobbying for ${o.name}` : `Nomination form: ${o.name}`, amount: -o.form }, ...s.txns].slice(0, 40) });
          if (o.appointed) {
            const ok = Math.random() < appointChance(longLeg(s.contacts));
            set({
              politics: ok ? { ...p, office: target, termEnds: day + TERM_DAYS, campaign: undefined } : p,
              packaging: clamp(get().packaging + (ok ? 15 : 0)),
              eventResult: ok
                ? { emoji: '👑', title: 'Presidential appointment!', text: `The President don appoint you ${o.name}! Convoy, siren, everything. Abuja na your own now 🚨`, chips: [`${o.emoji} ${o.title}`, `+${formatNaira(o.allowance)}/day`, '+15 👔'] }
                : { emoji: '📵', title: 'No appointment', text: 'Your name no reach the President table this time. The money don go "consultants" 😩 Build more Long Leg.', chips: [] },
            });
            return;
          }
          set({ politics: { ...p, campaign: { target, support: startingSupport(s.packaging), electionDay: day + CAMPAIGN_DAYS, done: {} } } });
          get().toast(`🗳️ You don declare for ${o.name}! Election na Day ${day + CAMPAIGN_DAYS}. Go campaign!`);
        },

        campaign: (move) => {
          const s = get();
          const p = s.politics ?? NO_POLITICS;
          const c = p.campaign;
          const m = MOVES.find((x) => x.id === move);
          if (!c || !m) return;
          if (s.active) return get().toast('😕 Finish wetin you dey do first');
          const { day } = clockParts(s.time);
          if (c.done[move] === day) return get().toast(`${m.emoji} You don do this one today. Try another move`);
          const cost = m.cost(c.target);
          if (s.money < cost) return get().toast(`😕 You need ${formatNaira(cost)}`);
          const gain = moveSupport(move, { packaging: s.packaging, longLeg: longLeg(s.contacts) });
          set({
            money: s.money - cost,
            needs: { ...tickNeeds(s.needs, m.minutes), energy: clamp(s.needs.energy - 20), social: clamp(s.needs.social + 15) },
            heat: clamp((s.heat ?? 0) + (move === 'rice' ? 10 : 0)),
            politics: { ...p, votesBought: p.votesBought || move === 'rice', campaign: { ...c, support: Math.min(95, c.support + gain), done: { ...c.done, [move]: day } } },
            txns: cost ? [{ at: s.time, label: `Campaign: ${m.label}`, amount: -cost }, ...s.txns].slice(0, 40) : s.txns,
          });
          get().toast(`${m.emoji} Support +${gain}%! (${Math.min(95, c.support + gain)}%)`);
        },

        admit: (id) => {
          const s = get();
          const sc = s.school ?? NO_SCHOOL;
          const p = programmeById(id);
          if (!p || sc.programme || !admissible(sc.jamb).some((x) => x.id === id)) return;
          set({ school: { ...sc, programme: id, level: 1, feesPaid: false, lectures: 0, study: 0, results: [] } });
          get().toast(`🎉 Admission! You don enter UniAbuja for ${p.name}. Pay school fees to start 100 Level.`);
        },

        payFees: () => {
          const s = get();
          const sc = s.school ?? NO_SCHOOL;
          const p = programmeById(sc.programme);
          if (!p || sc.feesPaid || sc.finalist || sc.graduated || s.money < p.fees) return;
          const day = clockParts(s.time).day;
          // Sometimes the new session opens straight into ASUU strike
          const strike = Math.random() < STRIKE_CHANCE ? day + STRIKE_DAYS[0] + Math.floor(Math.random() * (STRIKE_DAYS[1] - STRIKE_DAYS[0] + 1)) : undefined;
          set({
            money: s.money - p.fees,
            school: { ...sc, feesPaid: true, strikeUntil: strike },
            txns: [{ at: s.time, label: `UniAbuja school fees (${levelName(sc.level)})`, amount: -p.fees }, ...s.txns].slice(0, 40),
          });
          get().toast(strike ? `😩 Fees paid, but ASUU don declare strike till Day ${strike}. Read for library meanwhile.` : `✅ ${levelName(sc.level)} fees paid. Go attend lectures!`);
        },

        sortAdmission: () => {
          const s = get();
          const sc = s.school ?? NO_SCHOOL;
          if (sc.programme || sc.jamb === undefined || s.money < RUNS_COST) return;
          const scam = Math.random() < RUNS_SCAM;
          set({
            money: s.money - RUNS_COST,
            school: scam ? sc : { ...sc, jamb: Math.min(400, sc.jamb + RUNS_POINTS) },
            txns: [{ at: s.time, label: 'Admission "runs"', amount: -RUNS_COST }, ...s.txns].slice(0, 40),
          });
          get().toast(scam ? '😭 The "admission officer" don block your number. Na scam!' : `🤫 Your score don "increase" to ${Math.min(400, sc.jamb + RUNS_POINTS)}. Check portal.`);
        },

        enroll: (id) => {
          const s = get();
          const c = courseById(id);
          if (!c || s.courses?.[id] !== undefined) return;
          if (s.money < c.fee) return get().toast(`😕 School fees na ${formatNaira(c.fee)}`);
          set({ money: s.money - c.fee, courses: { ...s.courses, [id]: 0 }, txns: [{ at: s.time, label: `School fees: ${c.name}`, amount: -c.fee }, ...s.txns].slice(0, 40) });
          get().toast(`${c.emoji} You don enroll for ${c.name}! ${c.classes} classes to go`);
        },

        joinGym: () => {
          const s = get();
          const { day } = clockParts(s.time);
          if (s.money < GYM_FEE) return get().toast(`😕 Gym na ${formatNaira(GYM_FEE)} for ${GYM_DAYS} days`);
          set({ money: s.money - GYM_FEE, gymUntil: Math.max(s.gymUntil ?? 0, day) + GYM_DAYS, txns: [{ at: s.time, label: 'Gym membership', amount: -GYM_FEE }, ...s.txns].slice(0, 40) });
          get().toast(`🏋🏾 Gym membership active till Day ${Math.max(s.gymUntil ?? 0, day) + GYM_DAYS}`);
        },

        buyOutfit: (id) => {
          const s = get();
          const o = OUTFITS.find((x) => x.id === id);
          if (!o || s.wardrobe?.includes(id)) return;
          const price = Math.round(o.cost * (s.skills?.includes('tailoring') ? 0.8 : 1));
          if (s.money < price) return get().toast(`😕 ${o.name} na ${formatNaira(price)}`);
          set({
            money: s.money - price,
            wardrobe: [...(s.wardrobe ?? ['tee']), id],
            look: { ...(s.look ?? DEFAULT_LOOK), outfit: id },
            packaging: clamp(s.packaging + o.packaging),
            txns: [{ at: s.time, label: `Bought ${o.name}`, amount: -price }, ...s.txns].slice(0, 40),
          });
          get().toast(`${o.emoji} You don buy ${o.name}! 👔 +${o.packaging}`);
        },

        wearOutfit: (id) => {
          const s = get();
          if (!(s.wardrobe ?? ['tee']).includes(id)) return;
          set({ look: { ...(s.look ?? DEFAULT_LOOK), outfit: id } });
        },

        setHair: (id) => {
          const s = get();
          if ((s.look ?? DEFAULT_LOOK).hair === id) return;
          if (s.money < HAIR_COST) return get().toast(`😕 New hair na ${formatNaira(HAIR_COST)}`);
          set({
            money: s.money - HAIR_COST,
            look: { ...(s.look ?? DEFAULT_LOOK), hair: id },
            txns: [{ at: s.time, label: 'Barber / salon', amount: -HAIR_COST }, ...s.txns].slice(0, 40),
          });
          get().toast('💈 New look! You don fresh 😎');
        },

        setShirt: (color) => set({ shirt: color }),

        syncClock: () => {
          const s = get();
          if (!s.started) return;
          const nowMs = clock();
          if (s.epoch === undefined) {
            // Old save: keep the same day number, but from today the clock na real Abuja time
            const day = clockParts(s.time).day;
            const epoch = watMidnight(nowMs) - (day - 1) * 24 * 60 * 60 * 1000;
            const time = realMinutes(epoch, nowMs);
            set({ epoch, time, nextEventCheck: time + 10, nextWeatherChange: time + 120, nextPowerChange: Math.min(s.nextPowerChange, time + 240) });
            return;
          }
          const real = realMinutes(s.epoch, nowMs);
          const gap = real - s.time;
          if (gap <= 0) return;
          let needs = s.needs;
          let awayMin = gap;
          let done: Activity | undefined;
          const a = s.active ? activityById(s.active.id) : undefined;
          if (s.active && a) {
            // Whatever you were doing kept going while you were away
            const total = s.active.total ?? a.minutes;
            const speed = total / activityRealSeconds(total);
            const step = Math.min(gap * 60 * speed, s.active.remaining);
            needs = tickNeeds(needs, step, { gains: a.gains, activityMinutes: total, sleeping: a.sleep });
            awayMin = Math.max(0, gap - step / speed / 60);
            const remaining = s.active.remaining - step;
            set({ active: { ...s.active, remaining, eventAt: undefined } });
            if (remaining <= 0) done = a;
          }
          // Life off-screen: needs drop while you dey away, but no lower than 25
          const drained = tickNeeds(needs, Math.min(awayMin, 24 * 60));
          needs = Object.fromEntries(NEED_KEYS.map((k) => [k, Math.max(Math.min(needs[k], 25), drained[k])])) as Needs;
          set({ needs, time: real, nextEventCheck: Math.max(s.nextEventCheck, real + 5) });
          if (done) finish(done);
        },

        tick: (realSeconds) => {
          const s = get();
          if (!s.started || s.event || s.eventResult || s.minigame) return;
          const dtReal = Math.min(realSeconds, 0.25);
          const a = s.active ? activityById(s.active.id) : undefined;

          let needs = s.needs;
          let time = s.time;
          const real = s.epoch !== undefined ? realMinutes(s.epoch, clock()) : null;
          // Back from somewhere (phone locked, app closed): catch up first
          if (real !== null && real - s.time > 2) return get().syncClock();

          if (s.active && a) {
            // Busy: legacy clock fast-forwards (~4 real seconds per activity);
            // real clock: short things quick, sleep and work take real minutes.
            const total = s.active.total ?? a.minutes;
            const speed = real !== null ? total / activityRealSeconds(total) : Math.max(10, total / 4);
            const step = Math.min(dtReal * speed, s.active.remaining);
            // Fit people get tired slower at work
            const gains = a.pay && (a.gains.energy ?? 0) < 0 ? { ...a.gains, energy: (a.gains.energy ?? 0) * workEnergyFactor(s.fitness ?? 0) } : a.gains;
            needs = tickNeeds(needs, step, { gains, activityMinutes: total, sleeping: a.sleep });
            time = real ?? time + step;
            const remaining = s.active.remaining - step;
            set({ needs, time, active: { ...s.active, remaining } });
            if (s.active.eventAt !== undefined && remaining <= s.active.eventAt && remaining > 0) {
              set({ active: { ...s.active, remaining, eventAt: undefined } });
              fireEvent('commute', a.id);
            } else if (remaining <= 0) finish(a);
          } else {
            // Legacy clock: 1 real second = 1 game minute. Real clock: a minute na a minute.
            const step = real !== null ? Math.max(0, real - s.time) : dtReal;
            needs = tickNeeds(needs, step);
            // Sitting down: catch your breath (a little energy back every real second)
            if (s.pose === 'sit') needs = { ...needs, energy: clamp(needs.energy + dtReal * SIT_REST) };
            // Dancing is fun but tiring; pressing phone passes time small
            if (s.pose === 'dance') needs = { ...needs, fun: clamp(needs.fun + dtReal * DANCE_FUN), energy: clamp(needs.energy - dtReal * DANCE_TIRE) };
            if (s.pose === 'phone') needs = { ...needs, fun: clamp(needs.fun + dtReal * PHONE_FUN) };
            if (s.sick) needs = { ...needs, energy: clamp(needs.energy - (SICK_DRAIN.energy! * step) / 60), fun: clamp(needs.fun - (SICK_DRAIN.fun! * step) / 60) };
            time = real ?? time + step;
            set({ needs, time });
            if (!s.target && !s.menu && !s.phone && time >= s.nextEventCheck) {
              set({ nextEventCheck: time + (real !== null ? 10 : 60) });
              if (Math.random() < IDLE_EVENT_CHANCE) fireEvent('idle');
            }
          }

          // Weather
          if (time >= (s.nextWeatherChange ?? 0)) {
            const prevW = s.weather ?? 'sunny';
            const rainy = !!combinedMods(s.news, clockParts(time).day).rainy;
            const weather = nextWeather(prevW, Math.random, rainy);
            set({ weather, nextWeatherChange: time + weatherSpell(weather, Math.random) });
            if (weather !== prevW) {
              const msg: Record<Weather, string> = {
                sunny: '☀️ Sun don come out. Hot like pepper!',
                cloudy: '🌤️ Cloud don gather small',
                rain: '🌧️ Rain don start! Road go slow',
                storm: '⛈️ Heavy storm! Thunder dey fire. Road go slow well well',
              };
              get().toast(msg[weather]);
              if (weather === 'storm' && get().power && Math.random() < 0.6) {
                set({ power: false, nextPowerChange: time + randomBetween(120, 360) });
                get().toast('🕯️ Storm don cut light 😩');
              }
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

          if (Math.floor(time) !== Math.floor(s.time) || !s.active) checkGoals();

          // New day greeting
          const prev = clockParts(s.time);
          const cur = clockParts(time);
          // Track the last day processed, so actions that jump the clock (dates, campaigns, events) no skip a rollover
          const lastDay = s.lastDay ?? prev.day;
          if (cur.day > lastDay) {
            set({ lastDay: cur.day });
            const fest = festivalOn(cur.day);
            now.toast(fest ? `${fest.emoji} ${fest.greeting}` : `🌅 Day ${cur.day} for Abuja. Make today count!`);
            const fl = get().flags ?? {};
            if (fl['garba-appt'] === cur.day - 1 && fl['garba-done'] === undefined) now.toast('📌 Today: meet Garba\'s Director for Federal Secretariat before 12 noon!');
            if (fl['chinedu-meet'] === cur.day - 1 && fl['chinedu-meet-done'] === undefined) now.toast('📌 Today: meet Chinedu for Federal Secretariat before 3pm!');
            if (fl['boss-ot'] === cur.day - 1) now.toast('📌 Today: overtime for office, Federal Secretariat before 2pm!');
            const { rentDueDay, rentLocked, area } = get();
            const left = rentDueDay - cur.day;
            if (AREAS[area].rent && (left === 7 || left === 1)) now.toast(`🏠 Rent go due in ${left} day${left > 1 ? 's' : ''}: ${formatNaira(AREAS[area].rent)}`);
            if (AREAS[area].rent && left === 0) now.toast('🏠 Rent don due today! Pay for phone → 🏠 Rent');
            // People forget you if you no dey check on them
            const contacts = Object.fromEntries(
              Object.entries(get().contacts).map(([id, c]) => [id, { ...c, rel: Math.max(5, c.rel - 1) }]),
            );
            set({ contacts, heat: Math.max(0, (get().heat ?? 0) - 4), fitness: Math.max(0, (get().fitness ?? 0) - 1) });
            // Politics: allowance, billboard support, election day, end of term
            const pol = get().politics ?? NO_POLITICS;
            if (pol.office >= 0 && (pol.termEnds === undefined || cur.day <= pol.termEnds)) {
              const pay = OFFICES[pol.office].allowance;
              set({ money: get().money + pay, txns: [{ at: time, label: `${OFFICES[pol.office].name} allowance`, amount: pay }, ...get().txns].slice(0, 40) });
            }
            const camp = pol.campaign;
            if (camp && Date.now() < (get().adBoostUntil ?? 0)) set({ politics: { ...pol, campaign: { ...camp, support: Math.min(95, camp.support + 2) } } });
            const pc = get().politics?.campaign;
            if (pc && cur.day >= pc.electionDay) {
              const o = OFFICES[pc.target];
              const won = electionWon(pc.support, Math.random());
              const after = get().politics ?? NO_POLITICS;
              set({
                politics: won ? { ...after, office: pc.target, termEnds: cur.day + TERM_DAYS, campaign: undefined } : { ...after, campaign: undefined },
                packaging: clamp(get().packaging + (won ? 5 * (pc.target + 1) : 0)),
                needs: { ...get().needs, fun: clamp(get().needs.fun + (won ? 30 : -30)) },
                contacts: won ? Object.fromEntries(Object.entries(get().contacts).map(([id, cs]) => [id, { ...cs, rel: clamp(cs.rel + 10) }])) : get().contacts,
                eventResult: won
                  ? { emoji: '🗳️🎉', title: `You don win! ${o.title} ${get().name}`, text: `INEC don declare you winner for ${o.name} with ${pc.support}% support! Supporters dey dance for street 💃🏾🕺🏾`, chips: [`${o.emoji} ${o.name}`, `+${formatNaira(o.allowance)}/day`, `+${5 * (pc.target + 1)} 👔`, '🦵 Everybody +10'] }
                  : { emoji: '😞', title: 'Election lost', text: `You get ${pc.support}% but the other candidate win. Some people say na rigging 🤷🏾. Build more support and try again.`, chips: ['-30 🎉'] },
              });
            } else if (pol.office >= 0 && pol.termEnds !== undefined && cur.day > pol.termEnds && !pol.campaign) {
              set({ politics: { ...pol, office: -1, termEnds: undefined, votesBought: false } });
              now.toast(`🗳️ Your term as ${OFFICES[pol.office].name} don end. Run again for 🗳️ Politics app`);
            }
            // World news: old stories end, sometimes a new one breaks
            const running = (get().news ?? []).filter((n) => n.until >= cur.day);
            if (Math.random() < 0.5) {
              const fresh = WORLD_NEWS.filter((n) => !running.some((r) => r.id === n.id));
              const pick = fresh[Math.floor(Math.random() * fresh.length)];
              if (pick) {
                running.push({ id: pick.id, until: cur.day + pick.days - 1 });
                now.toast(`📰 Breaking: ${pick.headline} ${pick.detail}`);
              }
            }
            set({ news: running });
            // Love cools if you no dey check on them; partners lift your mood
            const lv = get().loves ?? {};
            const nextLoves: Record<string, Love> = {};
            for (const [id, l] of Object.entries(lv)) {
              const quiet = Math.min(cur.day - (l.lastTextDay ?? -9), cur.day - (l.lastDateDay ?? -9)) >= 2;
              const interest = clamp(l.interest - (quiet ? (l.married ? 1 : DAILY_COOL) : 0));
              if (l.official && !l.married && interest < 15) {
                now.toast(`💔 ${matchById(id)?.name} don break up with you. You no dey check am 😢`);
                continue;
              }
              nextLoves[id] = { ...l, interest };
            }
            const partner = officialPartner(nextLoves);
            set({ loves: nextLoves, ...(partner ? { needs: { ...get().needs, social: clamp(get().needs.social + 10) } } : {}) });
            // Sickness roll for the new day
            const hs = get();
            if (!hs.sick) {
              const kind = Math.random() < sickDodge(hs.fitness ?? 0) ? null : rollSickness(hs.needs, hs.hasNet, Math.random);
              if (kind && !hs.event && !hs.eventResult) {
                const info = SICKNESS[kind];
                set({
                  sick: kind,
                  eventResult: { emoji: info.emoji, title: `${info.name} don catch you!`, text: info.text, chips: ['🤒 You no fit work', `💊 ${info.cure}`] },
                });
              }
            }
            // Business income lands every morning
            const bz = get();
            let income = 0;
            const lines: string[] = [];
            for (const [id, owned] of Object.entries(bz.businesses)) {
              const b = businessById(id);
              if (!b || (owned.closedUntil !== undefined && cur.day < owned.closedUntil)) continue;
              const wet = bz.weather === 'rain' || bz.weather === 'storm' ? 0.8 : 1;
              const bad = Math.random() < badDayChance(owned.staff ?? 0);
              const net = dailyNet(b, owned, Math.random(), bad);
              const adBoost = Date.now() < (bz.adBoostUntil ?? 0) ? 1 + AD_BIZ_BOOST : 1;
              const p = net > 0 ? Math.round(net * wet * adBoost) : net;
              income += p;
              lines.push(b.name);
              if (bad) now.toast(`😩 Bad day for ${b.name}: ${formatNaira(-p)} loss (theft, NEPA or slow market)`);
            }
            if (lines.length && income !== 0) {
              set({ money: bz.money + income, txns: [{ at: time, label: `Business ${income > 0 ? 'income' : 'loss'}: ${lines.join(', ')}`, amount: income }, ...bz.txns].slice(0, 40) });
              if (income > 0) now.toast(`🏪 Business don bring ${formatNaira(income)} today`);
            }
            // Ego Save interest, paid daily into savings
            const sv = get();
            if (sv.savings > 0) {
              const interest = Math.round(sv.savings * SAVINGS_DAILY_RATE);
              set({ savings: sv.savings + interest, savingsInterest: sv.savingsInterest + interest });
            }
            if (sv.loan && cur.day === sv.loan.dueDay) now.toast(`📲 Ego Loan: pay ${formatNaira(sv.loan.owed)} today o!`);
            // Followers drift away if you no post for 2 days
            const g = get();
            if (g.time - g.lastPostAt > 2 * 24 * 60 && g.followers > 0) set({ followers: Math.floor(g.followers * 0.98) });
            // Property: buildings finish, tenants pay
            const props = { ...(get().properties ?? {}) };
            let rentIn = 0;
            for (const [id, p] of Object.entries(props) as [AreaId, Property][]) {
              if (p.status === 'building' && p.readyDay !== undefined && cur.day >= p.readyDay) {
                props[id] = { ...p, status: 'built' };
                now.toast(`🏡 Your house for ${AREAS[id].name} don finish! Move in or rent am out (🏠 Rent app)`);
              }
              if (p.status === 'built' && p.rentedOut && get().area !== id) rentIn += AREAS[id].own?.rentOut ?? 0;
            }
            set({ properties: props });
            if (rentIn) {
              const pm = get();
              set({ money: pm.money + rentIn, txns: [{ at: time, label: 'Rent from your tenants', amount: rentIn }, ...pm.txns].slice(0, 40) });
              now.toast(`🏘️ Your tenants pay ${formatNaira(rentIn)}`);
            }
            if (AREAS[area].rent && left < -RENT_GRACE_DAYS && !rentLocked) {
              set({ rentLocked: true });
              now.toast('🔒 Landlord don lock your room! Pay rent + 10% penalty to enter');
            }
          }
        },

        walkTo: (x, z) => {
          const s = get();
          if (s.active) return;
          if (s.pose) set({ pose: null });
          // Out in Abuja: follow the roads, even to the next place
          const path = planWalk(s, x, z);
          if (path && path.length) {
            set({ target: path[0], route: path.slice(1), pending: null, menu: null });
            return;
          }
          // Mansions stretch west: dining room and garage
          const b = s.place === 'home' ? homeBounds(s.area, BOUNDS.home) : BOUNDS[s.place];
          set({
            target: [Math.min(b.maxX, Math.max(b.minX, x)), Math.min(b.maxZ, Math.max(b.minZ, z))],
            route: [],
            pending: null,
            menu: null,
          });
        },

        shiftCell: (dc, dr) => {
          const s = get();
          const c = currentCell(s);
          if (!c) return;
          const next: Cell = [c[0] + dc, c[1] + dr];
          if (!inGrid(next)) return;
          const dx = dc * CELL_X;
          const dz = dr * CELL_Z;
          const mv = (p: [number, number]): [number, number] => [p[0] - dx, p[1] - dz];
          const here = placeAt(next, s.area);
          set({
            place: here ?? 'road',
            cell: here ? null : next,
            near: s.place === 'road' ? s.near : s.place,
            pos: mv(s.pos),
            target: s.target && mv(s.target),
            route: s.route.map(mv),
            menu: null,
          });
          if (here && here !== s.place) get().toast(`📍 ${placeLabel(here, s.area, PLACE_NAMES)}`);
        },

        headTo: (to) => {
          const s = get();
          const here = currentCell(s);
          const there = cellOfPlace(to, s.area);
          if (!there || s.active) return;
          if (!here) {
            get().toast(CAMPUS_PLACES.includes(s.place) && to === 'uniabuja' ? '🎓 You dey campus already' : CAMPUS_PLACES.includes(s.place) ? '🚪 Comot from campus through the main gate first' : '🚪 Comot outside first, then waka go there');
            return;
          }
          const e = to === 'street' ? ([0, 2] as [number, number]) : entrySpot(to, s.area);
          set({ phone: null, menu: null });
          get().walkTo(e[0] + (there[0] - here[0]) * CELL_X, e[1] + (there[1] - here[1]) * CELL_Z);
          get().toast(`${s.driving ? '🚗' : '🚶'} Heading to ${placeLabel(to, s.area, PLACE_NAMES)}. Follow the road!`);
        },

        setPose: (pose) => {
          const s = get();
          if (pose && (s.active || s.driving || s.target)) return;
          set({ pose: s.pose === pose ? null : pose });
          if (pose === 'sit' && s.pose !== 'sit') get().toast('🪑 You sit down. Energy dey come back small small.');
          // Kneel to greet somebody you know who dey near you: respect is reciprocal
          if (pose === 'kneel' && s.pose !== 'kneel') {
            const { hour, day } = clockParts(s.time);
            const me = live.pos ?? s.pos;
            const near = npcsAt(s.place, hour, day).find(({ id, spot }) => s.contacts[id] && Math.hypot(spot.pos[0] - me[0], spot.pos[1] - me[1]) < GREET_RANGE);
            const c = near && s.contacts[near.id];
            const who = near && contactById(near.id);
            if (near && c && who && c.lastGreetDay !== day) {
              set({ contacts: { ...s.contacts, [near.id]: { ...c, rel: clamp(c.rel + GREET_REL), lastGreetDay: day } } });
              get().toast(`🙏 You greet ${who.name} well. E like am! +${GREET_REL} relationship`);
            } else if (near && who) get().toast(`🙏 ${who.name} don already receive your greeting today`);
            else get().toast('🙏 You kneel greet. Walk near somebody you know make e count.');
          }
        },

        enterCar: () => {
          const s = get();
          if (!s.car || s.place === 'home' || s.active || s.driving) return;
          if ((s.car.fuel ?? START_FUEL) <= 0) {
            get().toast('⛽ No fuel for tank. Buy fuel for phone first.');
            return;
          }
          const spot = carSpot(s);
          if (!spot) return;
          const me = live.pos ?? s.pos;
          if (Math.hypot(me[0] - spot.pos[0], me[1] - spot.pos[1]) > 2.5) {
            // Walk to the car first
            const path = planWalk(s, spot.pos[0], spot.pos[1]);
            if (path && path.length) set({ target: path[0], route: path.slice(1), pending: ENTER_CAR, menu: null });
            else set({ target: spot.pos, route: [], pending: ENTER_CAR, menu: null });
            return;
          }
          live.rot = spot.rot;
          set({ driving: true, pos: spot.pos, target: null, route: [], menu: null });
          get().toast('🚗 Tap anywhere for road to drive there');
        },

        parkCar: () => {
          const s = get();
          if (!s.driving) return;
          const c = currentCell(s);
          const here = live.pos ?? s.pos;
          // Parking in front of your own gate counts as home
          const home = c && s.place === 'street' && Math.hypot(here[0] - HOME_PARK[0], here[1] - HOME_PARK[1]) < 4;
          // Step out onto the walkway beside the car
          const side = Math.cos(live.rot) * 1.3;
          const front = Math.sin(live.rot) * 1.3;
          set({
            driving: false,
            target: null,
            route: [],
            pos: [here[0] - side, here[1] + front],
            parked: home || !c ? null : { cell: c, pos: here, rot: live.rot },
          });
        },

        choose: (activityId) => {
          // Park and get out, or stand up, before doing anything
          if (get().driving) get().parkCar();
          if (get().pose) set({ pose: null });
          const s = get();
          const a = activityById(activityId);
          if (!a) return;
          const reason = blockReason(a, s);
          set({ menu: null, phone: null });
          if (reason) {
            get().toast(`😕 ${reason}`);
            return;
          }
          const spot = a.spot ? (activityPlace(a.id) === 'home' ? homeSpot(s.area, a.id, a.spot) : a.spot) : a.away ? exitSpot(s.place, s.area) : null;
          if (spot) {
            const path = planWalk(s, spot[0], spot[1]);
            if (path && path.length) set({ target: path[0], route: path.slice(1), pending: a.id });
            else set({ target: spot, route: [], pending: a.id });
          }
          else startActivity(a.id);
        },

        arrive: (pos) => {
          const { pending, route: rest } = get();
          // Driving burns fuel by distance
          const d0 = get();
          if (d0.driving && d0.car) {
            const c = carById(d0.car.id);
            const km = Math.hypot(pos[0] - d0.pos[0], pos[1] - d0.pos[1]) * KM_PER_UNIT;
            const fuel = Math.max(0, (d0.car.fuel ?? START_FUEL) - (km * (c?.litresPer100 ?? 10)) / 100);
            set({ car: { ...d0.car, fuel } });
            if (fuel <= 0) {
              set({ pos, target: null, route: [] });
              get().parkCar();
              get().toast('⛽ Fuel don finish! Motor park for roadside. Buy fuel for phone.');
              return;
            }
          }
          // More road to walk
          if (rest.length) {
            set({ pos, target: rest[0], route: rest.slice(1) });
            return;
          }
          set({ pos, target: null });
          if (pending === ENTER_CAR) {
            set({ pending: null });
            get().enterCar();
          } else if (pending) startActivity(pending);
        },

        cancel: () => {
          const s = get();
          const a = s.active && activityById(s.active.id);
          if (!a) return;
          set({ active: null, ...(a.away ? { pos: exitSpot(s.place, s.area) } : {}) });
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
      // The city grid got smaller: anybody left on a road or parked off the new grid goes back to their street
      merge: (persisted, current) => {
        const p = { ...(persisted as Partial<GameState>) };
        if (p.place === 'road' && !(p.cell && inGrid(p.cell))) Object.assign(p, { place: 'street', cell: null, pos: ENTRY_SPOT.street });
        if (p.parked && !inGrid(p.parked.cell)) p.parked = null;
        return { ...current, ...p };
      },
      partialize: (s) => ({
        started: s.started,
        name: s.name,
        shirt: s.shirt,
        time: s.time,
        money: s.money,
        place: s.place,
        cell: s.cell,
        near: s.near,
        parked: s.parked,
        needs: s.needs,
        packaging: s.packaging,
        pantry: s.pantry,
        cv: s.cv,
        area: s.area,
        rentDueDay: s.rentDueDay,
        rentLocked: s.rentLocked,
        contacts: s.contacts,
        unlocks: s.unlocks,
        stats: s.stats,
        grade: s.grade,
        gradeShifts: s.gradeShifts,
        businesses: s.businesses,
        car: s.car,
        sick: s.sick,
        heat: s.heat,
        flags: s.flags,
        loves: s.loves,
        homeUps: s.homeUps,
        look: s.look,
        courses: s.courses,
        politics: s.politics,
        lastDay: s.lastDay,
        skills: s.skills,
        school: s.school,
        fitness: s.fitness,
        gymUntil: s.gymUntil,
        wardrobe: s.wardrobe,
        birth: s.birth,
        epoch: s.epoch,
        properties: s.properties,
        adBoostUntil: s.adBoostUntil,
        swiped: s.swiped,
        weather: s.weather,
        nextWeatherChange: s.nextWeatherChange,
        news: s.news,
        eventTrip: s.eventTrip,
        hasNet: s.hasNet,
        goals: s.goals,
        savings: s.savings,
        savingsInterest: s.savingsInterest,
        loan: s.loan,
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
