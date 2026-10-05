import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { multiplayerEnabled, SUPABASE_KEY, SUPABASE_URL } from './config';

let client: SupabaseClient | null = null;

/** One shared Supabase client (auth session is kept in localStorage). */
export function getClient(): SupabaseClient | null {
  if (!multiplayerEnabled()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'abuja-life-auth' },
      realtime: { params: { eventsPerSecond: 10 }, heartbeatIntervalMs: 15000 },
    });
  }
  return client;
}
