import { useState, useRef, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const SYSTEM_PROMPT = {
  role: 'system',
  content:
    'Kamu adalah asisten konseling AI yang ramah, empatis, dan profesional untuk siswa sekolah. Kamu membantu siswa dengan masalah akademik, sosial, dan pribadi. Berikan respons dalam Bahasa Indonesia yang hangat dan supportif. Jangan memberikan saran medis yang spesifik. Jika siswa tampak dalam bahaya, sarankan mereka untuk segera menghubungi guru BK atau orang tua.',
};

export default function StatusChatbot({ onConnectionError }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isTyping]);

  function toggle() {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && messages.length === 0) {
        setMessages([
          { role: 'assistant', content: 'Halo! 👋 Saya asisten konseling AI. Saya siap membantu Anda. Apa yang ingin Anda diskusikan?' },
        ]);
      }
      return next;
    });
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setInput('');

    const nextHistory = [...messages, { role: 'user', content: text }];
    setMessages(nextHistory);
    setIsTyping(true);

    try {
      const { data } = await axiosClient.post('/api/chat', {
        messages: [SYSTEM_PROMPT, ...nextHistory],
      });
      setIsTyping(false);
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('Format respons tidak valid');
      }
    } catch (err) {
      setIsTyping(false);
      const message = err.response?.data?.error?.message || err.message || 'Terjadi kesalahan';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${message}\n\nPastikan backend berjalan di port 8080.` },
      ]);
      onConnectionError?.();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') sendMessage();
  }

  return (
    <>
      <button className={`chatbot-fab ${isOpen ? 'active' : ''}`} onClick={toggle}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <div className={`chat-modal ${isOpen ? 'open' : ''}`} style={{ display: isOpen ? 'flex' : 'none' }}>
        <div className="chat-modal-header">
          <div className="chat-modal-header-info">
            <div className="chat-modal-avatar">🤖</div>
            <div>
              <div className="chat-modal-title">Asisten Konseling AI</div>
              <div className="chat-modal-sub">Powered by Backend · Port 8080</div>
            </div>
          </div>
          <button className="chat-close-btn" onClick={toggle}>✕</button>
        </div>
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div className={`chat-msg ${msg.role === 'user' ? 'user' : 'bot'}`} key={i}>
              {msg.role !== 'user' && <div className="chat-msg-avatar">🤖</div>}
              <div className="chat-bubble">
                {msg.content.split('\n').map((line, j, arr) => (
                  <span key={j}>
                    {line}
                    {j < arr.length - 1 && <br />}
                  </span>
                ))}
              </div>
              {msg.role === 'user' && <div className="chat-msg-avatar">👤</div>}
            </div>
          ))}
          {isTyping && (
            <div className="chat-msg bot">
              <div className="chat-msg-avatar">🤖</div>
              <div className="chat-bubble typing-bubble">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-row">
          <input
            type="text"
            className="chat-input"
            placeholder="Ketik pesan Anda…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="chat-send" onClick={sendMessage}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="chat-footer">Chat aman · API Key tersimpan di backend</div>
      </div>
    </>
  );
}
