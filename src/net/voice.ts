/** Voice note recording, tuned small: mono, 16 kHz, Opus at 16 kbps (about 2 KB a second). */

export const MAX_VOICE_MS = 30_000;
const BITRATE = 16_000;

/** Best small codec this browser can record. Safari without Opus falls back to AAC in MP4. */
const TYPES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4'];

export const canRecord = () => typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

export function pickMime(isSupported: (t: string) => boolean = (t) => MediaRecorder.isTypeSupported(t)): string {
  return TYPES.find(isSupported) ?? '';
}

/** Content type for upload, without codec parameters, and a matching file extension. */
export function fileTypeOf(mime: string): { type: string; ext: string } {
  const type = (mime.split(';')[0] || 'audio/webm').trim();
  const ext = type === 'audio/mp4' ? 'm4a' : type === 'audio/ogg' ? 'ogg' : 'webm';
  return { type, ext };
}

export type Recording = { blob: Blob; ms: number; type: string; ext: string };

export type Recorder = { stop: () => Promise<Recording | null>; cancel: () => void; startedAt: number };

export async function startRecording(onAutoStop: () => void): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const mime = pickMime();
  const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: BITRATE });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const startedAt = Date.now();
  let cancelled = false;
  const done = new Promise<Recording | null>((resolve) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearTimeout(limit);
      if (cancelled || !chunks.length) return resolve(null);
      const { type, ext } = fileTypeOf(rec.mimeType || mime);
      resolve({ blob: new Blob(chunks, { type }), ms: Math.min(MAX_VOICE_MS, Date.now() - startedAt), type, ext });
    };
  });
  const limit = setTimeout(() => {
    if (rec.state === 'recording') {
      rec.stop();
      onAutoStop();
    }
  }, MAX_VOICE_MS);
  rec.start();
  return {
    startedAt,
    stop: () => {
      if (rec.state === 'recording') rec.stop();
      return done;
    },
    cancel: () => {
      cancelled = true;
      if (rec.state === 'recording') rec.stop();
    },
  };
}

export const formatMs = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
