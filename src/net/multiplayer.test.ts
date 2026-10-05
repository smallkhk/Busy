import { beforeAll, describe, expect, it, vi } from 'vitest';

// A fake Supabase channel that records handlers so tests can play the server.
const handlers: Record<string, (arg: unknown) => void> = {};
let presence: Record<string, unknown[]> = {};
const sent: unknown[] = [];
const tracked: unknown[] = [];
let statusCb: (s: string) => void = () => {};
const fakeChannel = {
  on(type: string, filter: { event: string }, cb: (arg: unknown) => void) {
    handlers[`${type}:${filter.event}`] = cb;
    return fakeChannel;
  },
  subscribe(cb: (s: string) => void) {
    statusCb = cb;
    cb('SUBSCRIBED');
    return fakeChannel;
  },
  presenceState: () => presence,
  track: (m: unknown) => (tracked.push(m), Promise.resolve()),
  send: (m: unknown) => (sent.push(m), Promise.resolve()),
};
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ channel: () => fakeChannel, removeChannel: () => Promise.resolve(), realtime: { isConnected: () => true, connect: () => {} } }),
}));
vi.mock('./config', () => ({ SUPABASE_URL: 'x', SUPABASE_KEY: 'k', multiplayerEnabled: () => true }));

const mp = await import('./multiplayer');
const { useNet } = await import('./useNet');

describe('multiplayer', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    mp.startMultiplayer('Musa', '#fff');
    vi.useRealTimers();
  });

  it('counts everybody online but only shows players in my room', () => {
    mp.joinRoom('street-kubwa');
    presence = {
      [mp.playerId()]: [{ id: mp.playerId(), name: 'Musa', room: 'street-kubwa', x: 0, z: 0 }],
      ada: [{ id: 'ada', name: 'Ada', shirt: '#f00', room: 'street-kubwa', x: 1, z: 2 }],
      tunde: [{ id: 'tunde', name: 'Tunde', shirt: '#0f0', room: 'wuse', x: 0, z: 0 }],
    };
    handlers['presence:sync']({});
    expect(useNet.getState().online).toBe(3);
    expect(Object.keys(useNet.getState().players)).toEqual(['ada']);
  });

  it('tells the others which room I entered', () => {
    expect(tracked.at(-1)).toMatchObject({ name: 'Musa', room: 'street-kubwa' });
  });

  it('moves players from broadcasts in my room only', () => {
    handlers['broadcast:move']({ payload: { id: 'ada', room: 'street-kubwa', x: 5, z: 6 } });
    handlers['broadcast:move']({ payload: { id: 'ada', room: 'wuse', x: 9, z: 9 } });
    expect(useNet.getState().players.ada).toMatchObject({ x: 5, z: 6 });
  });

  it('shows chat from my room and sends mine with the room', () => {
    handlers['broadcast:chat']({ payload: { id: 'ada', name: 'Ada', text: 'How far!', at: 1, room: 'street-kubwa' } });
    handlers['broadcast:chat']({ payload: { id: 'tunde', name: 'Tunde', text: 'Wuse gist', at: 2, room: 'wuse' } });
    expect(useNet.getState().chat.map((m) => m.text)).toEqual(['How far!']);
    expect(mp.sendChat('Abuja dey sweet')).toBe(true);
    expect(sent.at(-1)).toMatchObject({ event: 'chat', payload: { text: 'Abuja dey sweet', room: 'street-kubwa' } });
  });

  it('rides out a short network blip, then reports reconnecting', () => {
    vi.useFakeTimers();
    statusCb('CHANNEL_ERROR');
    vi.advanceTimersByTime(3000);
    expect(useNet.getState().connected).toBe(true);
    vi.advanceTimersByTime(1500);
    expect(useNet.getState().connected).toBe(false);
    expect(useNet.getState().everConnected).toBe(true);
    statusCb('SUBSCRIBED');
    expect(useNet.getState().connected).toBe(true);
    vi.useRealTimers();
  });

  it('house is private', () => {
    mp.joinRoom(null);
    handlers['presence:sync']({});
    expect(useNet.getState().players).toEqual({});
    expect(mp.sendChat('hello')).toBe(false);
  });
});
