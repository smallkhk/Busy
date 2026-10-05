import { create } from 'zustand';

export type Remote = { id: string; name: string; shirt: string; x: number; z: number; hidden?: boolean };
export type ChatMsg = { id: string; name: string; text: string; at: number; mine?: boolean };

type NetState = {
  connected: boolean;
  /** Connected at least once this session (so we say "reconnecting", not "connecting"). */
  everConnected: boolean;
  online: number;
  room: string | null;
  players: Record<string, Remote>;
  chat: ChatMsg[];
  /** Latest message per player, shown above their head for a few seconds. */
  bubbles: Record<string, { text: string; until: number }>;
};

export const useNet = create<NetState>(() => ({ connected: false, everConnected: false, online: 0, room: null, players: {}, chat: [], bubbles: {} }));
