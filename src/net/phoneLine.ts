import type { RealtimeChannel } from '@supabase/supabase-js';
import { useGame } from '../store/game';
import { CallEngine, type Signal } from './calls';
import { getClient } from './supabase';

/** STUN finds your public address; set VITE_TURN_* for phones behind strict networks. */
function iceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  const turn = import.meta.env.VITE_TURN_URL as string | undefined;
  if (turn) servers.push({ urls: turn, username: import.meta.env.VITE_TURN_USER as string, credential: import.meta.env.VITE_TURN_PASS as string });
  return servers;
}

let speaker: HTMLAudioElement | null = null;

const outgoing = new Map<string, Promise<RealtimeChannel>>();

/** Join the other person's call channel once, then reuse it to send. */
function channelFor(to: string): Promise<RealtimeChannel> {
  const c = getClient();
  if (!c) return Promise.reject(new Error('offline'));
  let ch = outgoing.get(to);
  if (!ch) {
    ch = new Promise((resolve, reject) => {
      const chan = c.channel(`call:${to}`);
      chan.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve(chan);
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          outgoing.delete(to);
          reject(new Error(status));
        }
      });
    });
    outgoing.set(to, ch);
  }
  return ch;
}

export const phoneLine = new CallEngine(
  {
    send: async (to, sig) => {
      const ch = await channelFor(to);
      await ch.send({ type: 'broadcast', event: 'sig', payload: sig });
    },
  },
  {
    getMic: () => navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }),
    makePeer: () => new RTCPeerConnection({ iceServers: iceServers() }),
    play: (stream) => {
      if (!speaker) speaker = new Audio();
      speaker.srcObject = stream;
      void speaker.play().catch(() => undefined);
    },
    stop: () => {
      if (speaker) {
        speaker.pause();
        speaker.srcObject = null;
      }
    },
  },
  {
    money: () => useGame.getState().money,
    charge: (amount, label) => useGame.getState().adjustMoney(-amount, label),
  },
);

let started = false;

/** Start listening for calls on my own line. */
export function startPhoneLine(uid: string, name: string) {
  phoneLine.me = { id: uid, name };
  const c = getClient();
  if (!c || started) return;
  started = true;
  c.channel(`call:${uid}`)
    .on('broadcast', { event: 'sig' }, ({ payload }) => void phoneLine.receive(payload as Signal))
    .subscribe();
}

export const canPlaceCalls = () => typeof RTCPeerConnection !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
