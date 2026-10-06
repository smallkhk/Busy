import { create } from 'zustand';
import { useGame } from '../store/game';
import { applySave, saveNow } from './cloud';
import { getClient } from './supabase';

/**
 * Username and password accounts on top of Supabase Auth. Every player starts as
 * a guest (anonymous user); setting a username and password turns that same
 * account into a permanent one, so the Player ID, cloud save, friends and admin
 * rights all stay. Logging in on another phone loads your life from the cloud.
 *
 * Usernames become a placeholder email (example.com is reserved: nothing is ever
 * sent there). The Supabase project must have "Confirm email" turned off.
 */
const DOMAIN = 'player.example.com';
const friendly = (m: string) => (/fetch|network|retries/i.test(m) ? 'Network wahala. Check your data and try again' : m);
export const USERNAME_RE = /^[a-z0-9_]{3,16}$/;
export const cleanUsername = (u: string) => u.trim().toLowerCase().replace(/^@/, '');
export const usernameEmail = (u: string) => `${cleanUsername(u)}@${DOMAIN}`;
/** The username of an account email, or null for guests and other emails. */
export const usernameOf = (email: string | null | undefined) => (email && email.endsWith(`@${DOMAIN}`) ? email.slice(0, -DOMAIN.length - 1) : null);

export const useAccount = create<{ username: string | null; checked: boolean }>(() => ({ username: null, checked: false }));

/** Who is logged in on this phone. */
export async function refreshAccount() {
  const c = getClient();
  if (!c) return;
  const { data } = await c.auth.getSession();
  useAccount.setState({ username: usernameOf(data.session?.user.email), checked: true });
}

export function checkLogin(username: string, password: string): string | null {
  if (!USERNAME_RE.test(cleanUsername(username))) return 'Username: 3–16 letters, numbers or _ (no space)';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

/** Guest → permanent: keep this same account, add a username and password. */
export async function createLogin(username: string, password: string): Promise<string | null> {
  const c = getClient();
  if (!c) return 'You need internet';
  const bad = checkLogin(username, password);
  if (bad) return bad;
  const { data: s } = await c.auth.getSession();
  if (!s.session) return 'You never connect yet. Wait small, then try again';
  const { data, error } = await c.auth.updateUser({ email: usernameEmail(username), password });
  if (error) return /already|registered|exists/i.test(error.message) ? 'That username don dey taken. Try another one' : friendly(error.message);
  if (usernameOf(data.user?.email) !== cleanUsername(username)) {
    // The project still wants to confirm emails, so the username never saved
    return 'Login no fit save yet: game owner must turn off "Confirm email" for Supabase';
  }
  useAccount.setState({ username: cleanUsername(username) });
  await saveNow();
  return null;
}

/** Log in on this phone: your life from the cloud replaces the one here. */
export async function logIn(username: string, password: string): Promise<string | null> {
  const c = getClient();
  if (!c) return 'You need internet';
  if (!USERNAME_RE.test(cleanUsername(username))) return 'Check your username';
  // Keep whatever this phone has in the cloud before switching
  if (useGame.getState().started) await saveNow();
  const { data, error } = await c.auth.signInWithPassword({ email: usernameEmail(username), password });
  if (error || !data.user) return /invalid/i.test(error?.message ?? '') ? 'Wrong username or password' : friendly(error?.message ?? 'Login fail');
  const { data: save } = await c.from('saves').select('data').eq('user_id', data.user.id).maybeSingle();
  if (save?.data) applySave(save.data as Record<string, unknown>);
  else useGame.getState().reset();
  // Start fresh with the new account everywhere (chat, friends, cloud)
  window.setTimeout(() => window.location.reload(), 300);
  return null;
}

/** Log out: save, then this phone starts a new guest life. */
export async function logOut(): Promise<void> {
  const c = getClient();
  if (!c) return;
  await saveNow();
  await c.auth.signOut();
  useGame.getState().reset();
  window.setTimeout(() => window.location.reload(), 300);
}
