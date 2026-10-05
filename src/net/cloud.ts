import { create } from 'zustand';
import { CARS, RESALE } from '../content/cars';
import { businessById } from '../content/business';
import { longLeg } from '../content/contacts';
import { propertyValue } from '../content/housing';
import { clockParts } from '../engine/clock';
import { useGame, type GameState } from '../store/game';
import { cleanText } from './filter';
import { useSocial } from './social';
import { getClient } from './supabase';

/** Everything you own, minus what you owe. */
export function netWorth(s: Pick<GameState, 'money' | 'savings' | 'loan' | 'car' | 'businesses' | 'properties' | 'time'>): number {
  const day = clockParts(s.time).day;
  const car = s.car ? CARS.find((c) => c.id === s.car!.id) : undefined;
  const carValue = car ? Math.round(car.price * RESALE * (0.5 + (s.car!.condition ?? 100) / 200)) : 0;
  const biz = Object.entries(s.businesses ?? {}).reduce((sum, [id, o]) => sum + Math.round((businessById(id)?.cost ?? 0) * o.level * 0.6), 0);
  const props = Object.values(s.properties ?? {}).reduce((sum, p) => sum + (p ? propertyValue(p, day) : 0), 0);
  return Math.round(s.money + (s.savings ?? 0) - (s.loan?.owed ?? 0) + carValue + biz + props);
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newCode = (rand: () => number = Math.random) => Array.from({ length: 8 }, () => CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)]).join('');
export const formatCode = (c: string) => `${c.slice(0, 4)}-${c.slice(4)}`;
export const normaliseCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, '');

type CloudState = {
  status: 'off' | 'ready' | 'needs-setup';
  lastSaved: number | null;
  code: string | null;
  /** A cloud save newer than this phone's, waiting for you to decide. */
  offer: { day: number; data: Record<string, unknown> } | null;
};

export const useCloud = create<CloudState>(() => ({ status: 'off', lastSaved: null, code: null, offer: null }));

/** The same fields the phone saves locally. */
function snapshot(): Record<string, unknown> {
  const opts = useGame.persist.getOptions();
  return (opts.partialize ? opts.partialize(useGame.getState()) : useGame.getState()) as Record<string, unknown>;
}

let saving = false;

/** Saves your life and your leaderboard row. Returns an error message or null. */
export async function saveNow(): Promise<string | null> {
  const c = getClient();
  const { uid } = useSocial.getState();
  const g = useGame.getState();
  if (!c || !uid) return 'You need internet for cloud save';
  if (!g.started || saving) return null;
  // Never overwrite a newer cloud life while you never decide which one to keep
  if (useCloud.getState().offer) return null;
  saving = true;
  try {
    const code = useCloud.getState().code ?? newCode();
    const day = clockParts(g.time).day;
    const { error } = await c.from('saves').upsert({ user_id: uid, data: snapshot(), day, code, updated_at: new Date().toISOString() });
    if (error) {
      if (/relation|does not exist|schema cache/i.test(error.message)) useCloud.setState({ status: 'needs-setup' });
      return /relation|does not exist|schema cache/i.test(error.message) ? 'Cloud save never set up. Game owner: run supabase/cloud.sql' : `Save fail: ${error.message}`;
    }
    useCloud.setState({ code, lastSaved: Date.now(), status: 'ready' });
    await c.from('leaderboard').upsert({
      user_id: uid,
      name: cleanText(g.name, 16) || 'Hustler',
      shirt: g.shirt,
      net_worth: Math.max(-100000000, Math.min(100000000000, netWorth(g))),
      long_leg: longLeg(g.contacts),
      followers: Math.min(100000000, g.followers),
      packaging: Math.round(g.packaging),
      day,
      updated_at: new Date().toISOString(),
    });
    return null;
  } finally {
    saving = false;
  }
}

/** Replaces this phone's life with a saved one. */
export function applySave(data: Record<string, unknown>) {
  // Start from a clean life so nothing from this phone leaks into the loaded one
  useGame.getState().reset();
  useGame.setState({ ...(data as Partial<GameState>), started: true, phone: null, menu: null, event: null, eventResult: null, minigame: null, target: null, pending: null });
  // Old saves have no lastDay: treat today as already processed
  if (data.lastDay === undefined) useGame.setState({ lastDay: clockParts(useGame.getState().time).day });
  useGame.getState().syncClock();
  useGame.getState().toast('☁️ Your life don load! Welcome back 🙌🏾');
}

export async function loadFromCode(raw: string): Promise<string | null> {
  const c = getClient();
  const code = normaliseCode(raw);
  if (!c) return 'You need internet';
  if (code.length !== 8) return 'Code na 8 letters/numbers, like ABCD-2345';
  const { data, error } = await c.rpc('load_save_by_code', { p_code: code });
  if (error) return /function|does not exist|schema cache/i.test(error.message) ? 'Cloud save never set up. Game owner: run supabase/cloud.sql' : error.message;
  if (!data) return 'No save with that code 🤷🏾';
  applySave(data as Record<string, unknown>);
  // This phone gets its own new code
  useCloud.setState({ code: null });
  await saveNow();
  return null;
}

export function acceptOffer(take: boolean) {
  const offer = useCloud.getState().offer;
  useCloud.setState({ offer: null });
  if (take && offer) applySave(offer.data);
  void saveNow();
}

let started = false;

/** Checks the cloud for a newer save, then autosaves every minute and when you leave the app. */
export async function startCloud() {
  const c = getClient();
  const { uid } = useSocial.getState();
  if (!c || !uid || started) return;
  started = true;
  const { data, error } = await c.from('saves').select('data,day,code').eq('user_id', uid).maybeSingle();
  if (error) {
    useCloud.setState({ status: /relation|does not exist|schema cache/i.test(error.message) ? 'needs-setup' : 'off' });
    return;
  }
  useCloud.setState({ status: 'ready', code: (data?.code as string) ?? null });
  const localDay = clockParts(useGame.getState().time).day;
  if (data && (data.day as number) > localDay) useCloud.setState({ offer: { day: data.day as number, data: data.data as Record<string, unknown> } });
  else void saveNow();
  setInterval(() => void saveNow(), 60_000);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && void saveNow());
}

// ---------------- Leaderboards ----------------
export type Metric = 'net_worth' | 'long_leg' | 'followers' | 'packaging';
export type Row = { user_id: string; name: string; shirt: string; net_worth: number; long_leg: number; followers: number; packaging: number; day: number; updated_at: string };

/** Monday 00:00 this week, local time. */
export function weekStart(now = new Date()): Date {
  const d = new Date(now);
  const back = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - back);
  return d;
}

export async function fetchBoard(metric: Metric, weekly: boolean): Promise<Row[] | string> {
  const c = getClient();
  if (!c || !useSocial.getState().uid) return 'You need internet for rankings';
  let q = c.from('leaderboard').select('*').order(metric, { ascending: false }).limit(50);
  if (weekly) q = q.gte('updated_at', weekStart().toISOString());
  const { data, error } = await q;
  if (error) return /relation|does not exist|schema cache/i.test(error.message) ? 'Rankings never set up. Game owner: run supabase/cloud.sql' : error.message;
  return data as Row[];
}
