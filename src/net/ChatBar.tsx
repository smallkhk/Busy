import { useState } from 'react';
import { multiplayerEnabled } from './config';
import { sendChat } from './multiplayer';
import { useNet } from './useNet';

/** Online count, recent messages and a chat box for the place you dey. */
export function ChatBar() {
  const connected = useNet((s) => s.connected);
  const online = useNet((s) => s.online);
  const room = useNet((s) => s.room);
  const here = useNet((s) => Object.keys(s.players).length);
  const chat = useNet((s) => s.chat);
  const [text, setText] = useState('');
  if (!multiplayerEnabled()) return null;
  const send = () => {
    if (sendChat(text)) setText('');
  };
  return (
    <div className="chatbar card">
      <div className="chat-head small">
        <span className={`dot ${connected ? 'on' : ''}`} /> {connected ? `${online.toLocaleString('en-NG')} online` : 'Connecting…'}
        {room && <span className="muted"> · {here} other{here === 1 ? '' : 's'} here</span>}
      </div>
      {room && chat.length > 0 && (
        <div className="chat-log">
          {chat.slice(-3).map((m) => (
            <div key={`${m.id}${m.at}`} className="chat-line"><b>{m.mine ? 'You' : m.name}:</b> {m.text}</div>
          ))}
        </div>
      )}
      {room ? (
        <div className="chat-input">
          <input
            value={text}
            maxLength={120}
            placeholder={here ? `Talk to the ${here} people here…` : 'Nobody dey here yet. Say something…'}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="primary" onClick={send} aria-label="Send">➤</button>
        </div>
      ) : (
        <div className="muted small">🏠 Your house na private. Comot go street to meet people.</div>
      )}
    </div>
  );
}
