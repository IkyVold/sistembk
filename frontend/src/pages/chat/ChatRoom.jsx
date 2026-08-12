import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useChatSocket from './useChatSocket';
import Avatar from '../../components/Avatar';
import './chatRoom.css';

function formatMessageTime(timestamp) {
  const time = new Date(timestamp);
  const formattedTime = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  return `🕐 ${formattedTime} • ${formattedDate}`;
}

export default function ChatRoom({
  sessionId,
  currentUser, // { id, name, type }
  headerTitle,
  headerSubtitle,
  avatarUrl, // path foto (siswa) dari backend, opsional
  avatarName, // nama untuk fallback inisial avatar (bukan headerTitle, supaya inisialnya benar)
  backHref,
  backLabel,
  infoBannerDefault,
}) {
  const { events, connStatus, connMessage, typingText, sendMessage, notifyTyping } = useChatSocket({
    sessionId,
    currentUser,
  });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [events, typingText]);

  const isConnected = connStatus === 'connected';

  let bannerStyle = { background: '#EAF6EF', color: '#1E8E5A' };
  let bannerText = infoBannerDefault;
  if (!isConnected) {
    bannerStyle = { background: '#FBEEEA', color: '#B4432F' };
    bannerText = '⚠️ Koneksi terputus • Pesan akan tersimpan secara lokal';
  } else if (events.length > 0) {
    bannerText = '✅ Chat aktif • Pesan terkirim real-time';
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    if (!isConnected) {
      alert('Koneksi ke server terputus. Silakan refresh halaman.');
      return;
    }
    sendMessage(text);
    setInput('');
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    notifyTyping();
  }

  return (
    <div className="chat-shell">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-avatar">
            <Avatar src={avatarUrl} name={avatarName || headerTitle} size={40} className="chat-avatar-square" />
          </div>
          <div className="chat-header-text">
            <h2>{headerTitle}</h2>
            <p>{headerSubtitle}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="conn-pill">
            <span className={`status-badge ${isConnected ? 'online' : ''}`} />
            <span>{connMessage}</span>
          </span>
          <Link to={backHref} className="btn-back">← {backLabel}</Link>
        </div>
      </div>

      <div className="info-banner" style={bannerStyle}>{bannerText}</div>

      <div className="chat-messages">
        {events.map((event) => {
          if (event.type === 'system') {
            return (
              <div
                key={event.key}
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#6c757d',
                  padding: '8px',
                  margin: '5px 0',
                  background: '#e9ecef',
                  borderRadius: '20px',
                  width: 'fit-content',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                {event.text}
              </div>
            );
          }

          const message = event.data;
          const isSent =
            String(message.senderId) === String(currentUser.id) ||
            (message.senderType && currentUser.type && message.senderType === currentUser.type &&
              String(message.senderId) === String(currentUser.id));
          const displayName = isSent
            ? 'Saya'
            : (message.senderName || (message.senderType === 'guru' ? 'Guru BK' : 'Siswa'));

          return (
            <div className={`message ${isSent ? 'sent' : 'received'}`} key={event.key}>
              <Avatar
                src={message.senderType === 'siswa' ? message.senderFoto : null}
                name={message.senderName || displayName}
                size={28}
                className="message-avatar"
              />
              <div className="message-bubble">
                <div className="message-name">{displayName}</div>
                <div className="message-text">{message.message}</div>
                <div className="message-time">{formatMessageTime(message.timestamp)}</div>
              </div>
            </div>
          );
        })}

        {typingText && (
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
            <span style={{ marginLeft: '8px', fontSize: '12px' }}>{typingText}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder="Ketik pesan Anda..."
          autoComplete="off"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <button className="send-btn" onClick={handleSend} disabled={!isConnected}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
