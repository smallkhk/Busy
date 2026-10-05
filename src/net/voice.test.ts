import { describe, expect, it } from 'vitest';
import { fileTypeOf, formatMs, pickMime } from './voice';

describe('voice notes', () => {
  it('prefers Opus, falls back to AAC for Safari', () => {
    expect(pickMime(() => true)).toBe('audio/webm;codecs=opus');
    expect(pickMime((t) => t.startsWith('audio/mp4'))).toBe('audio/mp4;codecs=mp4a.40.2');
    expect(pickMime(() => false)).toBe('');
  });

  it('uploads with a plain content type and the right extension', () => {
    expect(fileTypeOf('audio/webm;codecs=opus')).toEqual({ type: 'audio/webm', ext: 'webm' });
    expect(fileTypeOf('audio/mp4;codecs=mp4a.40.2')).toEqual({ type: 'audio/mp4', ext: 'm4a' });
    expect(fileTypeOf('')).toEqual({ type: 'audio/webm', ext: 'webm' });
  });

  it('formats durations like WhatsApp', () => {
    expect(formatMs(4200)).toBe('0:04');
    expect(formatMs(30000)).toBe('0:30');
  });
});
