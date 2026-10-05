import { create, type StoreApi, type UseBoundStore } from 'zustand';

/** You need at least this much for account before you fit call anybody. Receiving na free. */
export const CALL_MIN_BALANCE = 50000;
/** Airtime the caller pays per started minute. */
export const AIRTIME_PER_MIN = 100;
export const RING_TIMEOUT_MS = 30000;

export type CallPhase = 'idle' | 'calling' | 'incoming' | 'connecting' | 'live' | 'ended';

export type CallState = {
  phase: CallPhase;
  peer: string | null;
  peerName: string;
  callId: string | null;
  /** True when I dialled. Only the caller pays airtime. */
  outgoing: boolean;
  startedAt: number | null;
  muted: boolean;
  endReason?: string;
};

export type Signal = {
  t: 'offer' | 'answer' | 'ice' | 'hangup' | 'decline' | 'busy';
  callId: string;
  from: string;
  name: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

/** How signals travel between phones (Supabase broadcast in the game, a fake in tests). */
export type Transport = { send: (to: string, sig: Signal) => Promise<void> };

/** Mic and peer connection (the browser in the game, fakes in tests). */
export type Media = {
  getMic: () => Promise<MediaStream>;
  makePeer: () => RTCPeerConnection;
  play: (stream: MediaStream) => void;
  stop: () => void;
};

export type Wallet = { money: () => number; charge: (amount: number, label: string) => void };

const IDLE: CallState = { phase: 'idle', peer: null, peerName: '', callId: null, outgoing: false, startedAt: null, muted: false };

const newId = () => Math.random().toString(36).slice(2, 10);

/** One phone line: dial, ring, answer, hang up. */
export class CallEngine {
  readonly store: UseBoundStore<StoreApi<CallState>>;
  private pc: RTCPeerConnection | null = null;
  private mic: MediaStream | null = null;
  private offer: Signal | null = null;
  private ice: RTCIceCandidateInit[] = [];
  private ringTimer: ReturnType<typeof setTimeout> | null = null;
  me: { id: string; name: string } | null = null;

  constructor(private transport: Transport, private media: Media, private wallet: Wallet, private now: () => number = Date.now) {
    this.store = create<CallState>(() => ({ ...IDLE }));
  }

  get state() {
    return this.store.getState();
  }

  private set(p: Partial<CallState>) {
    this.store.setState(p);
  }

  /** Why you can't call right now, or null. */
  cannotCall(): string | null {
    if (!this.me) return 'Calls never ready. Check your network';
    if (this.state.phase !== 'idle') return 'You dey another call';
    if (this.wallet.money() < CALL_MIN_BALANCE) return `You need at least ₦${CALL_MIN_BALANCE.toLocaleString('en-NG')} for account before you fit call. Receiving na free`;
    return null;
  }

  private sig(t: Signal['t'], extra: Partial<Signal> = {}): Signal {
    return { t, callId: this.state.callId ?? '', from: this.me?.id ?? '', name: this.me?.name ?? '', ...extra };
  }

  private async send(t: Signal['t'], extra: Partial<Signal> = {}) {
    const to = this.state.peer;
    if (to) await this.transport.send(to, this.sig(t, extra)).catch(() => undefined);
  }

  private async setupPeer() {
    this.mic = await this.media.getMic();
    const pc = this.media.makePeer();
    this.pc = pc;
    for (const tr of this.mic.getTracks()) pc.addTrack(tr, this.mic);
    pc.onicecandidate = (e) => {
      if (e.candidate) void this.send('ice', { candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => this.media.play(e.streams[0]);
    pc.onconnectionstatechange = () => {
      if (pc !== this.pc) return;
      if (pc.connectionState === 'connected' && this.state.phase !== 'live') {
        this.clearRing();
        this.set({ phase: 'live', startedAt: this.now() });
      } else if (pc.connectionState === 'failed') void this.end('Network no gree connect 😕', true);
    };
    return pc;
  }

  private async flushIce() {
    const pc = this.pc;
    if (!pc?.remoteDescription) return;
    const list = this.ice;
    this.ice = [];
    for (const c of list) await pc.addIceCandidate(c).catch(() => undefined);
  }

  private clearRing() {
    if (this.ringTimer) clearTimeout(this.ringTimer);
    this.ringTimer = null;
  }

  private ring(onTimeout: () => void) {
    this.clearRing();
    this.ringTimer = setTimeout(onTimeout, RING_TIMEOUT_MS);
  }

  async call(to: string, name: string): Promise<string | null> {
    const why = this.cannotCall();
    if (why) return why;
    this.set({ ...IDLE, phase: 'calling', peer: to, peerName: name, callId: newId(), outgoing: true });
    try {
      const pc = await this.setupPeer();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await this.send('offer', { sdp: { type: offer.type, sdp: offer.sdp } });
    } catch {
      await this.end('Your phone no gree use mic 🎤', true);
      return 'Allow microphone to call';
    }
    this.ring(() => {
      if (this.state.phase === 'calling') void this.end('No answer 📵', true);
    });
    return null;
  }

  async accept() {
    const offer = this.offer;
    if (this.state.phase !== 'incoming' || !offer?.sdp) return;
    this.clearRing();
    this.set({ phase: 'connecting' });
    try {
      const pc = await this.setupPeer();
      await pc.setRemoteDescription(offer.sdp);
      await this.flushIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await this.send('answer', { sdp: { type: answer.type, sdp: answer.sdp } });
    } catch {
      await this.end('Your phone no gree use mic 🎤', true);
    }
  }

  async decline() {
    if (this.state.phase !== 'incoming') return;
    await this.send('decline');
    await this.end('You decline am');
  }

  async hangup() {
    if (this.state.phase === 'idle' || this.state.phase === 'ended') return;
    await this.end('Call ended', true);
  }

  toggleMute() {
    const muted = !this.state.muted;
    this.mic?.getAudioTracks().forEach((t) => (t.enabled = !muted));
    this.set({ muted });
  }

  /** What the caller pays for a call that lasted `ms`. */
  static airtime(ms: number) {
    return Math.max(1, Math.ceil(ms / 60000)) * AIRTIME_PER_MIN;
  }

  private async end(reason: string, tell = false) {
    const s = this.state;
    if (s.phase === 'idle' || s.phase === 'ended') return;
    if (tell) await this.send('hangup');
    this.clearRing();
    if (s.outgoing && s.startedAt !== null) {
      this.wallet.charge(CallEngine.airtime(this.now() - s.startedAt), `📞 Airtime: call to ${s.peerName}`);
    }
    this.pc?.close();
    this.pc = null;
    this.mic?.getTracks().forEach((t) => t.stop());
    this.mic = null;
    this.media.stop();
    this.offer = null;
    this.ice = [];
    this.set({ phase: 'ended', endReason: reason });
    setTimeout(() => {
      if (this.state.phase === 'ended') this.store.setState({ ...IDLE });
    }, 2500);
  }

  /** A signal landed for me. */
  async receive(sig: Signal) {
    const s = this.state;
    if (sig.t === 'offer') {
      if (s.phase !== 'idle' && s.phase !== 'ended') {
        await this.transport.send(sig.from, { t: 'busy', callId: sig.callId, from: this.me?.id ?? '', name: this.me?.name ?? '' }).catch(() => undefined);
        return;
      }
      this.offer = sig;
      this.ice = [];
      this.set({ ...IDLE, phase: 'incoming', peer: sig.from, peerName: sig.name || 'Player', callId: sig.callId, outgoing: false });
      this.ring(() => {
        if (this.state.phase === 'incoming') void this.end(`Missed call from ${sig.name || 'Player'}`);
      });
      return;
    }
    if (sig.callId !== s.callId || sig.from !== s.peer || s.phase === 'idle' || s.phase === 'ended') return;
    if (sig.t === 'answer' && s.phase === 'calling' && sig.sdp && this.pc) {
      this.set({ phase: 'connecting' });
      await this.pc.setRemoteDescription(sig.sdp);
      await this.flushIce();
    } else if (sig.t === 'ice' && sig.candidate) {
      this.ice.push(sig.candidate);
      await this.flushIce();
    } else if (sig.t === 'decline') await this.end(`${s.peerName} no pick 📵`);
    else if (sig.t === 'busy') await this.end(`${s.peerName} dey another call`);
    else if (sig.t === 'hangup') await this.end(s.phase === 'incoming' ? `Missed call from ${s.peerName}` : 'Call ended');
  }
}
