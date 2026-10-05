import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIRTIME_PER_MIN, CALL_MIN_BALANCE, CallEngine, RING_TIMEOUT_MS, type Signal } from './calls';

/** Just enough of RTCPeerConnection: connects once both sides have both descriptions. */
class FakePeer {
  localDescription: unknown = null;
  remoteDescription: unknown = null;
  connectionState = 'new';
  onicecandidate: ((e: { candidate: null }) => void) | null = null;
  ontrack: ((e: { streams: unknown[] }) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  closed = false;
  addTrack() {}
  async createOffer() { return { type: 'offer', sdp: 'o' }; }
  async createAnswer() { return { type: 'answer', sdp: 'a' }; }
  async setLocalDescription(d: unknown) { this.localDescription = d; this.check(); }
  async setRemoteDescription(d: unknown) { this.remoteDescription = d; this.check(); }
  async addIceCandidate() {}
  close() { this.closed = true; }
  private check() {
    if (this.localDescription && this.remoteDescription && this.connectionState !== 'connected') {
      this.connectionState = 'connected';
      this.onconnectionstatechange?.();
    }
  }
}

const fakeMic = () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream;

function phone(id: string, money: number, net: Map<string, CallEngine>, clock: { t: number }) {
  const wallet = { cash: money, money: () => wallet.cash, charge: (n: number) => { wallet.cash -= n; } };
  const e = new CallEngine(
    { send: async (to: string, sig: Signal) => { await net.get(to)?.receive(sig); } },
    { getMic: async () => fakeMic(), makePeer: () => new FakePeer() as unknown as RTCPeerConnection, play: () => {}, stop: () => {} },
    wallet,
    () => clock.t,
  );
  e.me = { id, name: id.toUpperCase() };
  net.set(id, e);
  return { e, wallet };
}

describe('player calls', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('you need money to call, but anybody fit receive', async () => {
    const net = new Map<string, CallEngine>();
    const clock = { t: 0 };
    const broke = phone('broke', CALL_MIN_BALANCE - 1, net, clock);
    const rich = phone('rich', CALL_MIN_BALANCE * 10, net, clock);
    expect(await broke.e.call('rich', 'RICH')).toMatch(/need at least/);
    expect(rich.e.state.phase).toBe('idle');

    // The broke one still fit pick when the rich one call
    expect(await rich.e.call('broke', 'BROKE')).toBeNull();
    expect(broke.e.state.phase).toBe('incoming');
    await broke.e.accept();
    expect(rich.e.state.phase).toBe('live');
    expect(broke.e.state.phase).toBe('live');
  });

  it('caller pays airtime per started minute; receiver pays nothing', async () => {
    const net = new Map<string, CallEngine>();
    const clock = { t: 0 };
    const a = phone('a', 100000, net, clock);
    const b = phone('b', 0, net, clock);
    await a.e.call('b', 'B');
    await b.e.accept();
    clock.t = 2 * 60000 + 5000;
    await b.e.hangup();
    expect(a.e.state.phase).toBe('ended');
    expect(a.wallet.cash).toBe(100000 - 3 * AIRTIME_PER_MIN);
    expect(b.wallet.cash).toBe(0);
  });

  it('declined and unanswered calls cost nothing', async () => {
    const net = new Map<string, CallEngine>();
    const clock = { t: 0 };
    const a = phone('a', 100000, net, clock);
    const b = phone('b', 0, net, clock);
    await a.e.call('b', 'B');
    await b.e.decline();
    expect(a.e.state.endReason).toMatch(/no pick/);
    vi.advanceTimersByTime(3000);
    expect(a.e.state.phase).toBe('idle');

    await a.e.call('b', 'B');
    await vi.advanceTimersByTimeAsync(RING_TIMEOUT_MS + 10);
    expect(b.e.state.endReason ?? '').toMatch(/Missed call/);
    expect(a.wallet.cash).toBe(100000);
  });

  it('a third caller hears busy', async () => {
    const net = new Map<string, CallEngine>();
    const clock = { t: 0 };
    const a = phone('a', 100000, net, clock);
    phone('b', 100000, net, clock);
    const c = phone('c', 100000, net, clock);
    await a.e.call('b', 'B');
    await c.e.call('b', 'B');
    expect(c.e.state.endReason).toMatch(/another call/);
  });
});
