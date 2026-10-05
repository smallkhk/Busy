import { useEffect, useState } from 'react';
import { sfx } from '../audio/sound';
import { phoneLine } from '../net/phoneLine';
import { useSocial } from '../net/social';

const mmss = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Full-screen phone call: ringing, incoming, live and ended. */
export function CallOverlay() {
  const call = phoneLine.store();
  const shirt = useSocial((s) => (call.peer ? s.profiles[call.peer]?.shirt : undefined));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (call.phase === 'idle' || call.phase === 'ended') return;
    const ringing = call.phase === 'incoming' || call.phase === 'calling';
    const beep = () => {
      if (call.phase === 'incoming') {
        sfx.ring();
        navigator.vibrate?.([300, 150, 300]);
      } else if (call.phase === 'calling') sfx.ringback();
    };
    if (ringing) beep();
    const id = setInterval(() => {
      setNow(Date.now());
      if (ringing) beep();
    }, ringing ? 2000 : 1000);
    return () => clearInterval(id);
  }, [call.phase]);

  if (call.phase === 'idle') return null;
  const status =
    call.phase === 'calling' ? 'Ringing… 📞'
    : call.phase === 'incoming' ? 'Dey call you…'
    : call.phase === 'connecting' ? 'Connecting…'
    : call.phase === 'live' ? mmss(now - (call.startedAt ?? now))
    : call.endReason ?? 'Call ended';

  return (
    <div className="call-screen">
      <div className="call-who">
        <div className="call-avatar" style={{ background: shirt ?? '#2f9e6b' }}>{call.peerName.slice(0, 1).toUpperCase()}</div>
        <div className="call-name">{call.peerName}</div>
        <div className="call-status">{status}</div>
        {call.phase === 'live' && call.outgoing && <div className="muted small">Airtime ₦100 every minute</div>}
      </div>
      <div className="call-buttons">
        {call.phase === 'incoming' && (
          <>
            <button className="call-btn decline" onClick={() => void phoneLine.decline()} aria-label="Decline">📵</button>
            <button className="call-btn accept" onClick={() => void phoneLine.accept()} aria-label="Answer">📞</button>
          </>
        )}
        {(call.phase === 'calling' || call.phase === 'connecting' || call.phase === 'live') && (
          <>
            <button className={`call-btn mute ${call.muted ? 'on' : ''}`} onClick={() => phoneLine.toggleMute()} aria-label={call.muted ? 'Unmute' : 'Mute'}>{call.muted ? '🔇' : '🎙️'}</button>
            <button className="call-btn decline" onClick={() => void phoneLine.hangup()} aria-label="Hang up">📵</button>
          </>
        )}
      </div>
    </div>
  );
}
