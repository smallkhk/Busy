import { create } from 'zustand';
import { cleanText } from './filter';
import { useSocial } from './social';
import { getClient } from './supabase';
import { MAX_AD_DAYS } from '../content/billboards';

export type Ad = { slot: number; owner: string; owner_name: string; body: string; emoji: string; color: string; expires_at: string };

type BoardState = { status: 'idle' | 'loading' | 'ready' | 'needs-setup' | 'offline'; ads: Record<number, Ad> };

export const useBoards = create<BoardState>(() => ({ status: 'idle', ads: {} }));

export const isLive = (ad: Ad | undefined, now = Date.now()): ad is Ad => !!ad && Date.parse(ad.expires_at) > now;

export async function loadAds() {
  const c = getClient();
  if (!c || useSocial.getState().status !== 'ready') return useBoards.setState({ status: 'offline' });
  useBoards.setState((s) => ({ status: s.status === 'ready' ? 'ready' : 'loading' }));
  const { data, error } = await c.from('billboards').select('slot,owner,owner_name,body,emoji,color,expires_at');
  if (error) return useBoards.setState({ status: 'needs-setup' });
  useBoards.setState({ status: 'ready', ads: Object.fromEntries((data as Ad[]).map((a) => [a.slot, a])) });
}

/** Rents (or extends your own) billboard. Returns an error message, or null when it don post. */
export async function rentAd(slot: number, ad: { body: string; emoji: string; color: string; days: number }, playerName: string): Promise<string | null> {
  const c = getClient();
  const uid = useSocial.getState().uid;
  if (!c || !uid) return 'You need internet for billboards';
  const body = cleanText(ad.body, 40);
  if (!body) return 'Write something for the board';
  const days = Math.max(1, Math.min(MAX_AD_DAYS, Math.round(ad.days)));
  const current = useBoards.getState().ads[slot];
  if (isLive(current) && current.owner !== uid) return 'Somebody don rent this board already';
  // Extending your own running ad adds on top of the time left.
  const from = isLive(current) && current.owner === uid ? Date.parse(current.expires_at) : Date.now();
  const expires = new Date(Math.min(from + days * 86400000, Date.now() + MAX_AD_DAYS * 86400000)).toISOString();
  const row = { slot, owner: uid, owner_name: cleanText(playerName, 16) || 'Hustler', body, emoji: ad.emoji, color: ad.color, expires_at: expires, updated_at: new Date().toISOString() };
  const { data, error } = current ? await c.from('billboards').update(row).eq('slot', slot).select('slot') : await c.from('billboards').insert(row).select('slot');
  if (!error && !data?.length) {
    await loadAds();
    return 'Somebody don rent am first. Pick another board';
  }
  if (error) return /relation|does not exist|schema cache/i.test(error.message) ? 'Billboards never set up. Game owner: run supabase/billboards.sql' : 'Somebody don rent am first. Pick another board';
  await loadAds();
  return null;
}

/** You get at least one ad running now (for the business bonus). */
export const hasLiveAd = () => {
  const uid = useSocial.getState().uid;
  return !!uid && Object.values(useBoards.getState().ads).some((a) => a.owner === uid && isLive(a));
};
