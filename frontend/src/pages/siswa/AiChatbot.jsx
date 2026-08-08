import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import axiosClient from '../../api/axiosClient';

const AiChatbot = forwardRef(function AiChatbot(_props, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant', content }
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open: () => {
      setIsOpen(true);
      setMessages((prev) =>
        prev.length === 0
          ? [{ role: 'assistant', content: 'Halo! 👋 Saya asisten konseling AI. Ada yang ingin kamu tanyakan atau ceritakan?' }]
          : prev
      );
    },
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isTyping]);

  function toggleOpen() {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && messages.length === 0) {
        setMessages([
          { role: 'assistant', content: 'Halo! 👋 Saya asisten konseling AI. Ada yang ingin kamu tanyakan atau ceritakan?' },
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
      const { data } = await axiosClient.post('/api/chat', { messages: nextHistory });
      setIsTyping(false);
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('Format respons tidak valid dari server');
      }
    } catch (err) {
      setIsTyping(false);
      const message = err.response?.data?.error?.message || err.message || 'Terjadi kesalahan';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Maaf, terjadi kesalahan: ${message}\n\nSilakan coba lagi nanti.` },
      ]);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') sendMessage();
  }

  return (
    <>
      <button className={`ai-chat-fab ${isOpen ? 'active' : ''}`} title="Tanya Asisten Konseling AI" onClick={toggleOpen}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <circle cx="15" cy="10" r="1.5" />
          <path d="M9 14s1 1 3 1 3-1 3-1" />
        </svg>
      </button>

      <div className={`ai-chat-modal ${isOpen ? 'open' : ''}`}>
        <div className="ai-chat-header">
          <div className="ai-chat-header-info">
            <div className="ai-chat-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="1.5" />
                <circle cx="15" cy="10" r="1.5" />
              </svg>
            </div>
            <div>
              <div className="ai-chat-title">Asisten Konseling AI</div>
              <div className="ai-chat-subtitle">Powered by Backend Server</div>
            </div>
          </div>
          <button className="ai-chat-close" onClick={toggleOpen}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="ai-chat-messages">
          {messages.map((msg, i) => (
            <div className={`ai-chat-msg ${msg.role === 'user' ? 'user' : 'bot'}`} key={i}>
              {msg.role !== 'user' && <div className="ai-msg-avatar">🤖</div>}
              <div className="ai-msg-bubble">
                {msg.role === 'user'
                  ? msg.content
                  : msg.content.split('\n').map((line, j) => (
                      <span key={j}>
                        {line}
                        {j < msg.content.split('\n').length - 1 && <br />}
                      </span>
                    ))}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="ai-chat-msg bot ai-typing">
              <div className="ai-msg-avatar">🤖</div>
              <div className="ai-msg-bubble">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-input-area">
          <input
            type="text"
            className="ai-chat-input-field"
            placeholder="Ketik pesan Anda..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="ai-chat-send" onClick={sendMessage}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="ai-chat-footer-note">Asisten AI — percakapan bersifat rahasia</div>
      </div>
    </>
  );
});

export default AiChatbot;
