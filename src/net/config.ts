/** Supabase project for multiplayer. The publishable key is meant to ship in the client. */
export const SUPABASE_URL = 'https://xtxuvuacinrphyicntll.supabase.co';
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY ?? '';

export const multiplayerEnabled = () => SUPABASE_KEY.length > 0;
