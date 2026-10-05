/**
 * All game audio is synthesised with WebAudio: no files, no licences.
 * The context starts on the first tap (browsers block audio before that).
 */
type Ambience = 'none' | 'street' | 'market' | 'lounge' | 'night' | 'murmur' | 'lake';

const MUTE_KEY = 'abuja-life-muted';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambienceGain: GainNode | null = null;
let ambienceStop: (() => void) | null = null;
let current: Ambience = 'none';
let muted = readMuted();

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export const isMuted = () => muted;

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* private mode: setting just won't stick */
  }
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05);
}

/** Call from a user gesture. Safe to call many times. */
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
    ambienceGain = ctx.createGain();
    ambienceGain.gain.value = 0.5;
    ambienceGain.connect(master);
    const want = current;
    current = 'none';
    setAmbience(want);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

// ---------------- building blocks ----------------

let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  return src;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, to: AudioNode | null = master, endFreq?: number) {
  if (!ctx || !to) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(to);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function burst(start: number, dur: number, filterFreq: number, vol: number, to: AudioNode | null = master, type: BiquadFilterType = 'bandpass') {
  if (!ctx || !to) return;
  const src = noise(ctx);
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterFreq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f).connect(g).connect(to);
  src.start(start);
  src.stop(start + dur + 0.02);
}

// ---------------- sound effects ----------------

export const sfx = {
  click() {
    if (ctx) tone(880, ctx.currentTime, 0.05, 'triangle', 0.08);
  },
  pop() {
    if (ctx) tone(520, ctx.currentTime, 0.12, 'sine', 0.12, master, 780);
  },
  cash() {
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(1318, t, 0.12, 'square', 0.08);
    tone(1760, t + 0.08, 0.35, 'square', 0.08);
    burst(t, 0.15, 6000, 0.1, master, 'highpass');
  },
  alert() {
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(660, t, 0.15, 'triangle', 0.2);
    tone(880, t + 0.15, 0.25, 'triangle', 0.2);
  },
  crash() {
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(120, t, 0.6, 'sawtooth', 0.35, master, 40);
    burst(t, 0.8, 900, 0.6, master, 'lowpass');
    burst(t + 0.05, 0.4, 3500, 0.3);
  },
  fanfare() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.11, 0.3, 'triangle', 0.18));
  },
  whoosh() {
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    const src = noise(ctx);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + 0.65);
  },
};

// ---------------- ambience ----------------

/** Continuous filtered noise bed (traffic, crowd, wind). */
function bed(freq: number, q: number, vol: number): () => void {
  if (!ctx || !ambienceGain) return () => {};
  const src = noise(ctx);
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(ambienceGain);
  src.start();
  return () => src.stop();
}

/** Calls `fn` at random intervals until stopped. */
function every(minMs: number, maxMs: number, fn: () => void): () => void {
  let timer = 0;
  const loop = () => {
    timer = window.setTimeout(() => {
      fn();
      loop();
    }, minMs + Math.random() * (maxMs - minMs));
  };
  loop();
  return () => clearTimeout(timer);
}

/** A light afrobeats groove at 104 BPM, scheduled ahead with the audio clock. */
function afrobeat(): () => void {
  if (!ctx || !ambienceGain) return () => {};
  const out = ambienceGain;
  const c = ctx;
  const step = 60 / 104 / 4; // 16th notes
  const kick = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  const clap = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
  const bass = [55, 0, 0, 55, 0, 0, 65.4, 0, 73.4, 0, 0, 73.4, 0, 65.4, 0, 0];
  const chords = [[220, 261.6, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [196, 246.9, 293.7]];
  let next = c.currentTime + 0.1;
  let i = 0;
  const timer = window.setInterval(() => {
    while (next < c.currentTime + 0.25) {
      const s = i % 16;
      if (kick[s]) tone(110, next, 0.25, 'sine', 0.5, out, 45);
      if (clap[s]) burst(next, 0.12, 1800, 0.35, out);
      burst(next, 0.03, 9000, s % 2 ? 0.05 : 0.09, out, 'highpass'); // shaker
      if (bass[s]) tone(bass[s], next, step * 2.5, 'triangle', 0.35, out);
      if (s === 2 || s === 10) chords[Math.floor(i / 16) % 4].forEach((f) => tone(f * 2, next, 0.18, 'triangle', 0.05, out));
      next += step;
      i++;
    }
  }, 60);
  return () => clearInterval(timer);
}

export function setAmbience(a: Ambience) {
  if (a === current) return;
  current = a;
  ambienceStop?.();
  ambienceStop = null;
  if (!ctx) return; // will start on unlock
  const stops: (() => void)[] = [];
  switch (a) {
    case 'street':
      stops.push(bed(250, 0.6, 0.35));
      stops.push(every(4000, 11000, () => {
        const t = ctx!.currentTime;
        tone(415, t, 0.18, 'square', 0.05, ambienceGain);
        tone(415, t + 0.25, 0.3, 'square', 0.05, ambienceGain);
      }));
      break;
    case 'market':
      stops.push(bed(700, 0.8, 0.4));
      stops.push(bed(1400, 1.2, 0.15));
      break;
    case 'murmur':
      stops.push(bed(600, 1, 0.2));
      break;
    case 'lake':
      stops.push(bed(400, 0.3, 0.18));
      break;
    case 'lounge':
      stops.push(afrobeat());
      stops.push(bed(900, 1, 0.08));
      break;
    case 'night':
      stops.push(every(250, 900, () => {
        const t = ctx!.currentTime;
        tone(4200, t, 0.04, 'sine', 0.03, ambienceGain);
        tone(4200, t + 0.07, 0.04, 'sine', 0.03, ambienceGain);
      }));
      break;
    default:
      break;
  }
  ambienceStop = () => stops.forEach((s) => s());
}
